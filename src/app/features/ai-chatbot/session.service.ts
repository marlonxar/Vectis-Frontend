import { Injectable, computed, effect, signal } from '@angular/core';

export type PlanId = 'basic' | 'pro' | 'business';

export interface DaySchedule {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  closed: boolean;
  open: string;   // "09:00"
  close: string;  // "18:00"
}

export interface ChatbotConfig {
  company: string;
  desc: string;
  persona: string;
  info: string;
  hours: string;           // texto derivado del horario (para el backend/persona)
  schedule: DaySchedule[]; // horario por día
  // Contacto del negocio
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  urlAgenda: string;
  urlDoc: string;
  websiteUrl: string;
  inventoryUrl: string;
  // Base de conocimiento (archivos subidos, ya extraídos a texto)
  kbText: string;
  kbFileName: string;
  kbFileUrl: string;
  inventoryText: string;
  inventoryFileName: string;
  inventoryFileUrl: string;
  faqs: { q: string; a: string }[];
  widgetTitle: string;
  widgetPosition: 'right' | 'left';
  brandColor: string;
  secondBrandColor: string;
  brandLogoUrl: string;
  welcome: string;
  quickReplies: string[];
  origins: string[];
  extraRules: string;
  language: string;
  privacyUrl: string;
  privacyText: string;
  // Handoff a humano (Telegram — bot propio del negocio)
  handoffEnabled: boolean;
  telegramBotToken: string;
  telegramBotUsername: string;
  telegramChatId: string;   // solo lectura (lo llena el worker al vincular)
}

/** Defaults para campos opcionales de apariencia/privacidad. */
export const CONFIG_DEFAULTS = {
  widgetTitle: 'Asistente de chat',
  brandColor: '#E7AB2E',
  secondBrandColor: '#0A0A0A',
  welcome: '¡Hola! 👋 ¿En qué puedo ayudarte hoy?',
  privacyUrl: 'https://wearevectis.com/privacy',
  privacyText: 'Al chatear aceptas el tratamiento de tus datos según el aviso de privacidad de Vectis.',
};

/** Convierte una fila de la tabla `chatbots` (snake_case) a ChatbotConfig (camelCase). */
export function rowToConfig(r: Record<string, any>): ChatbotConfig {
  return {
    company: r['company'] ?? '',
    desc: r['description'] ?? '',
    persona: r['persona'] ?? '',
    info: r['business_info'] ?? '',
    hours: '',
    schedule: Array.isArray(r['schedule']) && r['schedule'].length ? r['schedule'] : defaultSchedule(),
    contactName: r['contact_name'] ?? '',
    contactPhone: r['contact_phone'] ?? '',
    contactEmail: r['contact_email'] ?? '',
    contactAddress: r['contact_address'] ?? '',
    urlAgenda: r['url_agenda'] ?? '',
    urlDoc: r['url_documentation'] ?? '',
    websiteUrl: r['website_url'] ?? '',
    inventoryUrl: r['inventory_url'] ?? '',
    kbText: r['kb_text'] ?? '',
    kbFileName: r['kb_file_name'] ?? '',
    kbFileUrl: r['kb_file_url'] ?? '',
    inventoryText: r['inventory_text'] ?? '',
    inventoryFileName: r['inventory_file_name'] ?? '',
    inventoryFileUrl: r['inventory_file_url'] ?? '',
    faqs: Array.isArray(r['faqs']) ? r['faqs'] : [],
    widgetTitle: r['widget_title'] ?? '',
    widgetPosition: r['widget_position'] === 'left' ? 'left' : 'right',
    brandColor: r['brand_color'] ?? '',
    secondBrandColor: r['second_brand_color'] ?? '',
    brandLogoUrl: r['brand_logo_url'] ?? '',
    welcome: r['welcome_message'] ?? '',
    quickReplies: Array.isArray(r['quick_replies']) ? r['quick_replies'] : [],
    origins: Array.isArray(r['allowed_origins']) ? r['allowed_origins'] : [],
    extraRules: r['extra_rules'] ?? '',
    language: r['language'] ?? 'auto',
    privacyUrl: r['privacy_url'] ?? '',
    privacyText: r['privacy_text'] ?? '',
    handoffEnabled: !!r['handoff_enabled'],
    telegramBotToken: r['telegram_bot_token'] ?? '',
    telegramBotUsername: r['telegram_bot_username'] ?? '',
    telegramChatId: r['telegram_chat_id'] ?? '',
  };
}

/** Convierte ChatbotConfig a las columnas de la tabla `chatbots`. */
export function configToDb(c: ChatbotConfig): Record<string, unknown> {
  return {
    company: c.company,
    description: c.desc,
    persona: c.persona,
    business_info: c.info,
    schedule: c.schedule,
    contact_name: c.contactName,
    contact_phone: c.contactPhone,
    contact_email: c.contactEmail,
    contact_address: c.contactAddress,
    url_agenda: c.urlAgenda,
    url_documentation: c.urlDoc,
    website_url: c.websiteUrl,
    inventory_url: c.inventoryUrl,
    kb_text: c.kbText,
    kb_file_name: c.kbFileName,
    kb_file_url: c.kbFileUrl,
    inventory_text: c.inventoryText,
    inventory_file_name: c.inventoryFileName,
    inventory_file_url: c.inventoryFileUrl,
    faqs: c.faqs,
    widget_title: c.widgetTitle,
    widget_position: c.widgetPosition || 'right',
    brand_color: c.brandColor,
    second_brand_color: c.secondBrandColor,
    brand_logo_url: c.brandLogoUrl,
    welcome_message: c.welcome,
    quick_replies: c.quickReplies,
    allowed_origins: c.origins,
    extra_rules: c.extraRules,
    language: c.language,
    privacy_url: c.privacyUrl,
    privacy_text: c.privacyText,
    // Nota: los campos de handoff (handoff_enabled, telegram_*) NO se guardan aquí;
    // se gestionan en la página "Handoff a humano" para no pisarlos al guardar el configure.
  };
}

export function defaultSchedule(): DaySchedule[] {
  const days: DaySchedule['day'][] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return days.map((day) => ({
    day,
    closed: day === 'sun',
    open: day === 'sat' ? '09:00' : '09:00',
    close: day === 'sat' ? '13:00' : '18:00',
  }));
}

export interface ProfileRow {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  preferred_lang?: string | null;
  plan?: string | null;
  plan_expiry?: string | null;
  created_at?: string | null;
  cancel_at_period_end?: boolean | null;
}

export interface ChatbotRow {
  id: string;
  company: string;
  config?: ChatbotConfig | null;
  status?: string | null;
}

export interface SupportTicket {
  id: string;
  chatbotId: string;
  chatbotName?: string;
  subject: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  response?: string | null;
  respondedAt?: string | null;
  date: string;
}

/**
 * Estado de sesión del onboarding (mock / pass-through por ahora).
 * Se reemplaza por la sesión real (login + chatbot_clients) en otra fase.
 */
@Injectable({ providedIn: 'root' })
export class ChatbotSessionService {
  // --- Cuenta ---
  readonly firstName = signal('Marlon');
  readonly lastName = signal('Álvarez');
  readonly email = signal('marlon@wearevectis.com');
  readonly phone = signal('');
  readonly preferredLang = signal<'es' | 'en'>('es');
  readonly createdAt = signal('2026-06-24');
  readonly planExpiry = signal('');

  readonly plan = signal<PlanId>('pro');
  readonly cancelAtPeriodEnd = signal(false);
  readonly bannerDismissed = signal(false);
  readonly needsActiveReview = signal(false); // se forzó a elegir chatbots activos
  readonly originsTrimmed = signal(false);    // al bajar de plan se recortaron dominios → avisar

  // --- ChatBots (empresas) creados ---
  readonly companies = signal<string[]>([]);
  readonly clientIds = signal<string[]>([]);
  readonly configs = signal<ChatbotConfig[]>([]);
  readonly statuses = signal<string[]>([]);
  readonly current = signal(0);


  // --- Derivados ---
  readonly userName = computed(() => `${this.firstName()} ${this.lastName()}`.trim() || 'Usuario');
  readonly currentCompany = computed(() => this.companies()[this.current()] || '');
  readonly currentClientId = computed(() => this.clientIds()[this.current()] || '');
  readonly currentConfig = computed<ChatbotConfig | null>(() => this.configs()[this.current()] ?? null);
  readonly maxCompanies = computed(() => (this.plan() === 'business' ? 3 : 1));
  readonly canAddCompany = computed(() => this.companies().length < this.maxCompanies());
  /** Dominios/subdominios permitidos por chatbot según el plan (Business 3, resto 1). */
  readonly originLimit = computed(() => (this.plan() === 'business' ? 3 : 1));

  // --- Límite de chatbots ACTIVOS según el plan ---
  readonly maxActive = computed(() => (this.plan() === 'business' ? 3 : 1));
  readonly activeCount = computed(() => this.statuses().filter((s) => s === 'ACTIVE').length);
  readonly overLimit = computed(() => this.activeCount() > this.maxActive());
  readonly currentStatus = computed(() => this.statuses()[this.current()] ?? 'ACTIVE');
  readonly currentActive = computed(() => this.currentStatus() === 'ACTIVE');
  readonly hasInactive = computed(() => this.statuses().some((s) => s === 'INACTIVE'));
  isActiveAt(i: number): boolean { return (this.statuses()[i] ?? 'ACTIVE') === 'ACTIVE'; }
  setStatusLocal(i: number, status: string): void {
    const a = [...this.statuses()]; a[i] = status; this.statuses.set(a);
  }
  /** Actualiza (en memoria) los dominios permitidos de un chatbot por índice. */
  setOriginsLocal(i: number, origins: string[]): void {
    const a = [...this.configs()];
    if (a[i]) { a[i] = { ...a[i], origins }; this.configs.set(a); }
  }
  readonly planName = computed(() => ({ basic: 'Basic', pro: 'Pro', business: 'Business' }[this.plan()]));
  /** ¿El usuario ya eligió un plan? (tiene fecha de vencimiento). */
  readonly hasPlan = computed(() => !!this.planExpiry());
  /** Plan vencido (solo aplica si tiene plan). Sin plan ≠ vencido. */
  readonly planExpired = computed(() => {
    const e = this.planExpiry();
    if (!e) return false;
    return new Date(e + 'T23:59:59') < new Date();
  });
  /** Suscripción activa = no cancelada y no vencida. Si no, los ChatBots se consideran pausados. */
  readonly subscriptionActive = computed(() => !this.cancelAtPeriodEnd() && !(this.hasPlan() && this.planExpired()));
  /** Motivo del banner: cancelada o vencida (o null). */
  readonly bannerReason = computed<'cancelled' | 'expired' | null>(() =>
    this.cancelAtPeriodEnd() ? 'cancelled' : (this.hasPlan() && this.planExpired() ? 'expired' : null));
  /** Banner global: suscripción inactiva y el usuario no lo ha cerrado. */
  readonly showMembershipBanner = computed(() => this.bannerReason() !== null && !this.bannerDismissed());
  readonly initials = computed(() =>
    this.userName().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  );

  constructor() {
    // Recuerda el último chatbot seleccionado (para restaurarlo al recargar).
    effect(() => {
      const id = this.currentClientId();
      if (id) { try { localStorage.setItem('vxc_last_bot', id); } catch { /* noop */ } }
    });
  }

  selectCompany(i: number): void { this.current.set(i); }

  addCompany(name: string, clientId?: string, config?: ChatbotConfig): void {
    const n = (name || '').trim() || 'Mi empresa';
    const id = clientId || this.newClientId();
    this.companies.set([...this.companies(), n]);
    this.clientIds.set([...this.clientIds(), id]);
    this.configs.set([...this.configs(), config ?? this.emptyConfig(n)]);
    this.statuses.set([...this.statuses(), 'ACTIVE']);
    this.current.set(this.companies().length - 1);
  }

  /** Actualiza la configuración del chatbot actualmente seleccionado. */
  updateConfig(config: ChatbotConfig): void {
    const a = [...this.configs()];
    a[this.current()] = config;
    this.configs.set(a);
    const names = [...this.companies()];
    names[this.current()] = config.company || names[this.current()];
    this.companies.set(names);
  }

  private emptyConfig(company: string): ChatbotConfig {
    return {
      company, desc: '', persona: '', info: '', hours: '', schedule: defaultSchedule(),
      contactName: '', contactPhone: '', contactEmail: '', contactAddress: '',
      urlAgenda: '', urlDoc: '', websiteUrl: '',
      inventoryUrl: '', kbText: '', kbFileName: '', kbFileUrl: '', inventoryText: '', inventoryFileName: '', inventoryFileUrl: '',
      faqs: [], widgetTitle: '', widgetPosition: 'right', brandColor: '', secondBrandColor: '', brandLogoUrl: '', welcome: '',
      quickReplies: [], origins: [], extraRules: '', language: 'auto', privacyUrl: '', privacyText: '',
      handoffEnabled: false, telegramBotToken: '', telegramBotUsername: '', telegramChatId: '',
    };
  }

  newClientId(): string {
    try {
      if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
    } catch { /* noop */ }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  setAccount(p: { firstName?: string; lastName?: string; email?: string; phone?: string; lang?: 'es' | 'en' }): void {
    if (p.firstName !== undefined) this.firstName.set(p.firstName);
    if (p.lastName !== undefined) this.lastName.set(p.lastName);
    if (p.email !== undefined) this.email.set(p.email);
    if (p.phone !== undefined) this.phone.set(p.phone);
    if (p.lang !== undefined) this.preferredLang.set(p.lang);
  }


  /** Carga el perfil y los chatbots reales (tras iniciar sesión en Supabase). */
  hydrate(email: string, profile: ProfileRow | null, bots: ChatbotRow[]): void {
    this.email.set(email);
    if (profile) {
      this.firstName.set(profile.first_name ?? '');
      this.lastName.set(profile.last_name ?? '');
      this.phone.set(profile.phone ?? '');
      this.preferredLang.set((profile.preferred_lang as 'es' | 'en') ?? 'es');
      this.plan.set((profile.plan as PlanId) ?? 'basic');
      this.planExpiry.set(profile.plan_expiry ? String(profile.plan_expiry).slice(0, 10) : '');
      this.createdAt.set(profile.created_at ? String(profile.created_at).slice(0, 10) : '');
      this.cancelAtPeriodEnd.set(!!profile.cancel_at_period_end);
    }
    this.companies.set(bots.map((b) => b.company));
    this.clientIds.set(bots.map((b) => b.id));
    this.configs.set(bots.map((b) => (b.config ?? this.emptyConfig(b.company))));
    this.statuses.set(bots.map((b) => b.status ?? 'ACTIVE'));
    // Restaura el último chatbot seleccionado si sigue existiendo.
    let idx = 0;
    try {
      const last = localStorage.getItem('vxc_last_bot');
      if (last) { const f = bots.findIndex((b) => b.id === last); if (f >= 0) idx = f; }
    } catch { /* noop */ }
    this.current.set(idx);
  }

  /** Limpia el estado al cerrar sesión. */
  reset(): void {
    this.firstName.set(''); this.lastName.set(''); this.email.set(''); this.phone.set('');
    this.preferredLang.set('es'); this.plan.set('basic'); this.planExpiry.set(''); this.createdAt.set(''); this.cancelAtPeriodEnd.set(false);
    this.companies.set([]); this.clientIds.set([]); this.configs.set([]); this.statuses.set([]); this.current.set(0);
    this.needsActiveReview.set(false);
  }
}
