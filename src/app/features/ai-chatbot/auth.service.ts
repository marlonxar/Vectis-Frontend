import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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

/**
 * Caducidad de sesión (lado cliente).
 * Supabase por sí solo renueva el token para siempre; aquí forzamos que la sesión expire por:
 *   1) INACTIVIDAD: tras SESSION_IDLE_HOURS sin usar la app.
 *   2) ABSOLUTA:    como tope, SESSION_ABSOLUTE_DAYS desde el login (aunque siga activo).
 * (Ajusta ambos números aquí.)
 */
const SESSION_IDLE_HOURS = 48;       // inactividad
const SESSION_ABSOLUTE_DAYS = 7;     // tope absoluto desde el login
const SESSION_IDLE_MS = SESSION_IDLE_HOURS * 60 * 60 * 1000;
const SESSION_ABSOLUTE_MS = SESSION_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000;
const SESSION_START_KEY = 'da_session_started';   // hora de login (tope absoluto)
const SESSION_LAST_KEY = 'da_session_last';       // última actividad (inactividad)

@Injectable({ providedIn: 'root' })
export class ChatbotAuthService {
  private sb = inject(SupabaseClientService).client;
  private store = inject(ChatbotSessionService);
  private translate = inject(TranslateService);
  private router = inject(Router);

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
      if (data.session) {
        const now = Date.now();
        if (!this.sessionStart()) this.setSessionStart(now);   // sesiones previas: ancla el tope absoluto desde ahora
        if (!this.lastActivity()) this.setLastActivity(now);
        if (this.isSessionExpired()) { await this.forceLogout(); this.authReady.set(true); return; }
        this.setLastActivity(now);   // abrir la app cuenta como actividad
      }
      await this.apply(data.session);
      this.authReady.set(true);
      this.startActivityTracking();
      this.startExpiryWatcher();
    });
    this.sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') { const now = Date.now(); this.setSessionStart(now); this.setLastActivity(now); }   // login nuevo → reinicia relojes
      if (event === 'SIGNED_OUT') this.clearSessionMarks();
      if (session && this.isSessionExpired()) { void this.forceLogout(); return; }
      void this.apply(session);
    });
  }

  isLoggedIn(): boolean { return !!this.user(); }

  // ── Caducidad de sesión (inactividad + tope absoluto, lado cliente) ──
  private read(key: string): number | null { try { const v = localStorage.getItem(key); return v ? Number(v) : null; } catch { return null; } }
  private write(key: string, ts: number): void { try { localStorage.setItem(key, String(ts)); } catch { /* noop */ } }
  private sessionStart(): number | null { return this.read(SESSION_START_KEY); }
  private setSessionStart(ts: number): void { this.write(SESSION_START_KEY, ts); }
  private lastActivity(): number | null { return this.read(SESSION_LAST_KEY); }
  private setLastActivity(ts: number): void { this.write(SESSION_LAST_KEY, ts); }
  private clearSessionMarks(): void { try { localStorage.removeItem(SESSION_START_KEY); localStorage.removeItem(SESSION_LAST_KEY); } catch { /* noop */ } }

  private isSessionExpired(): boolean {
    const start = this.sessionStart(), last = this.lastActivity(), now = Date.now();
    if (start != null && now - start > SESSION_ABSOLUTE_MS) return true;   // tope absoluto (7 días)
    if (last != null && now - last > SESSION_IDLE_MS) return true;         // inactividad (48 h)
    return false;
  }

  /** Marca actividad reciente (throttle: escribe como máximo cada 60 s). */
  private touchSession(): void {
    if (!this.user()) return;
    const last = this.lastActivity();
    const now = Date.now();
    if (last == null || now - last > 60_000) this.setLastActivity(now);
  }

  /** Escucha interacción del usuario para renovar la sesión por actividad. */
  private startActivityTracking(): void {
    try {
      const on = () => this.touchSession();
      ['click', 'keydown', 'pointerdown', 'scroll', 'visibilitychange'].forEach((ev) =>
        window.addEventListener(ev, on, { passive: true }));
    } catch { /* SSR / noop */ }
  }

  /** Cierra la sesión por caducidad y manda al login. */
  private async forceLogout(): Promise<void> {
    this.clearSessionMarks();
    try { await this.sb.auth.signOut(); } catch { /* noop */ }
    this.user.set(null); this.store.reset();
    try { void this.router.navigateByUrl('/?expired=1'); } catch { /* noop */ }
  }

  /** Revisa cada minuto si la sesión ya venció (por si la pestaña queda abierta). */
  private startExpiryWatcher(): void {
    setInterval(() => { if (this.user() && this.isSessionExpired()) void this.forceLogout(); }, 60_000);
  }

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
      await this.enforceOriginLimit();
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

  /** Al bajar de plan (p. ej. Business → Pro/Basic), recorta los dominios permitidos al límite del
   *  plan (deja el primero) y persiste el cambio. Marca `originsTrimmed` para avisar al usuario. */
  private async enforceOriginLimit(): Promise<void> {
    const limit = this.store.originLimit();
    const ids = this.store.clientIds();
    const configs = this.store.configs();
    let trimmedAny = false;
    for (let i = 0; i < configs.length; i++) {
      const origins = configs[i]?.origins ?? [];
      if (origins.length > limit) {
        const kept = origins.slice(0, limit);   // limit=1 → conserva solo el primero
        try { await this.sb.from('chatbots').update({ allowed_origins: kept }).eq('id', ids[i]); } catch { /* noop */ }
        this.store.setOriginsLocal(i, kept);
        trimmedAny = true;
      }
    }
    if (trimmedAny) this.store.originsTrimmed.set(true);
  }

  // ── Acciones de auth ──
  signUp(email: string, password: string, firstName: string, lastName: string) {
    return this.sb.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, preferred_lang: 'es' },
        emailRedirectTo: `${APP_URL}/`,
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
        redirectTo: `${APP_URL}/`,
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
