import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseClientService } from './supabase.client';
import { ChatbotSessionService, rowToConfig } from './session.service';

/**
 * Autenticación real con Supabase Auth.
 * Mantiene la sesión y, al iniciar sesión, carga el perfil y los chatbots
 * del usuario en ChatbotSessionService (que alimenta la UI).
 */
/** URL pública fija de la app. Los correos y redirecciones de auth SIEMPRE apuntan aquí (nunca a localhost). */
const APP_URL = 'https://www.aichatbot.wearevectis.com';

@Injectable({ providedIn: 'root' })
export class ChatbotAuthService {
  private sb = inject(SupabaseClientService).client;
  private store = inject(ChatbotSessionService);
  private translate = inject(TranslateService);

  /** Aplica el idioma de preferencia del usuario a toda la interfaz. */
  applyLang(lang: 'es' | 'en'): void {
    const l = lang === 'en' ? 'en' : 'es';
    this.translate.use(l);
    try { localStorage.setItem('vectis-lang', l); } catch { /* noop */ }
    try { document.documentElement.lang = l; } catch { /* noop */ }
  }

  readonly user = signal<User | null>(null);
  readonly authReady = signal(false);

  constructor() {
    this.sb.auth.getSession().then(async ({ data }) => {
      await this.apply(data.session);
      this.authReady.set(true);
    });
    this.sb.auth.onAuthStateChange((_event, session) => { void this.apply(session); });
  }

  isLoggedIn(): boolean { return !!this.user(); }

  private async apply(session: Session | null): Promise<void> {
    this.user.set(session?.user ?? null);
    if (session?.user) { await this.loadUserData(session.user); }
    else { this.store.reset(); }
  }

  /** Re-carga perfil + chatbots del usuario actual (tras crear/editar). */
  async reload(): Promise<void> {
    const u = this.user();
    if (u) await this.loadUserData(u);
  }

  private async loadUserData(user: User): Promise<void> {
    try {
      const [{ data: profile }, { data: bots }] = await Promise.all([
        this.sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        this.sb.from('chatbots').select('*').neq('status', 'DELETED').order('created_at', { ascending: true }),
      ]);
      const rows = (bots ?? []).map((r: Record<string, any>) => ({ id: r['id'] as string, company: r['company'] as string, status: r['status'] as string, config: rowToConfig(r) }));
      this.store.hydrate(user.email ?? '', profile, rows);
      this.applyLang(this.store.preferredLang());     // idioma del perfil → toda la UI del panel
      await this.enforceActiveLimit();
    } catch {
      // Si falla la carga, al menos refleja el correo.
      this.store.hydrate(user.email ?? '', null, []);
    }
  }

  /** Defensa: si hay más chatbots ACTIVOS que los permitidos, desactiva el exceso y obliga a revisar. */
  private async enforceActiveLimit(): Promise<void> {
    const max = this.store.maxActive();
    const statuses = this.store.statuses();
    const ids = this.store.clientIds();
    const activeIdx = statuses.map((s, i) => (s === 'ACTIVE' ? i : -1)).filter((i) => i >= 0);
    if (activeIdx.length <= max) return;
    const excess = activeIdx.slice(max); // mantener los primeros `max` (más antiguos)
    for (const i of excess) {
      try { await this.sb.from('chatbots').update({ status: 'INACTIVE' }).eq('id', ids[i]); } catch { /* noop */ }
      this.store.setStatusLocal(i, 'INACTIVE');
    }
    this.store.needsActiveReview.set(true);
  }

  // ── Acciones de auth ──
  signUp(email: string, password: string, firstName: string, lastName: string) {
    return this.sb.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, preferred_lang: 'es' },
        emailRedirectTo: `${APP_URL}`,
      },
    });
  }

  signIn(email: string, password: string) {
    return this.sb.auth.signInWithPassword({ email, password });
  }

  /** Inicia sesión con Google. Al volver a /ai-chatbot, onAuthStateChange carga el perfil y enruta. */
  signInWithGoogle() {
    return this.sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${APP_URL}`,
        queryParams: { prompt: 'select_account' },
      },
    });
  }

  forgot(email: string) {
    return this.sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/reset`,
    });
  }

  updatePassword(newPassword: string) {
    return this.sb.auth.updateUser({ password: newPassword });
  }

  signOut() { return this.sb.auth.signOut(); }

  /** Selecciona el plan del usuario (RPC segura: fija plan + vence en 30 días). */
  selectPlan(plan: string) {
    return this.sb.rpc('select_plan', { p_plan: plan });
  }

  /** Ruta a la que mandar al usuario tras iniciar sesión: panel si ya tiene chatbots, planes si no. */
  async routeAfterAuth(): Promise<string> {
    try {
      const { data: prof } = await this.sb.from('profiles').select('plan_expiry').maybeSingle();
      if (!prof || !prof['plan_expiry']) return '/plans';   // aún no elige plan
      const { data } = await this.sb.from('chatbots').select('id').neq('status', 'DELETED').limit(1);
      return data && data.length ? '/dashboard' : '/configure';
    } catch {
      return '/plans';
    }
  }
}
