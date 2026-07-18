import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotVersionFooterComponent } from './version-footer.component';
import { CHANGELOG } from './version';

/** /changelog — Historial de versiones (novedades). La más nueva abierta; las viejas en acordeón cerrado. */
@Component({
  selector: 'app-chatbot-changelog',
  standalone: true,
  imports: [ChatbotAppHeaderComponent, ChatbotVersionFooterComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <main class="content">
        <div class="wrap">
          <span class="eyebrow on-dark">Novedades</span>
          <h1 class="ttl">Historial de versiones</h1>
          <p class="lead on-dark">Cada versión de Vectis AI ChatBot y lo que trae.</p>

          <ol class="rels">
            @for (e of log; track e.version; let first = $first) {
              <li class="rel" [id]="anchor(e.version)" [class.open]="isOpen(e.version)">
                <button type="button" class="rel-head" (click)="toggle(e.version)" [attr.aria-expanded]="isOpen(e.version)" [attr.aria-label]="'Versión ' + e.version + ' — ' + e.title">
                  <span class="ver">v{{ e.version }}</span>
                  <span class="rel-title">{{ e.title }}</span>
                  @if (first) { <span class="latest">Actual</span> }
                  <span class="date">{{ e.date }}</span>
                  <svg class="chev" [class.up]="isOpen(e.version)" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                @if (isOpen(e.version)) {
                  <ul class="changes">
                    @for (c of e.changes; track c) { <li>{{ c }}</li> }
                  </ul>
                }
              </li>
            }
          </ol>
        </div>
      </main>
      <app-chatbot-version-footer></app-chatbot-version-footer>
    </div>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; overflow: hidden; background: var(--ink); color: var(--text-inv); }
    .content { flex: 1; min-width: 0; overflow-y: auto; }
    .wrap { padding: 44px clamp(20px, 4vw, 48px) 56px; max-width: 780px; }
    .ttl { font-size: clamp(28px, 4vw, 44px); margin-top: 12px; }
    .wrap .lead { margin-top: 14px; }
    .rels { list-style: none; padding: 0; margin: 30px 0 0; display: grid; gap: 12px; }
    .rel { position: relative; scroll-margin-top: 24px; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); overflow: hidden; }
    .rel.open { border-color: rgba(231,171,46,.4); }
    .rel:target { box-shadow: 0 0 0 3px rgba(231,171,46,.12); }
    .rel-head { width: 100%; display: flex; align-items: center; gap: 12px; padding: 18px 22px; background: transparent; border: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    .rel-head:hover { background: rgba(255,255,255,.03); }
    .ver { font-size: 17px; font-weight: 800; color: var(--gold-bright); font-variant-numeric: tabular-nums; flex-shrink: 0; }
    .rel-title { font-size: 15px; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .latest { flex-shrink: 0; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
      color: var(--gold-bright); background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); border-radius: 999px; padding: 4px 10px; }
    .date { margin-left: auto; flex-shrink: 0; font-size: 12.5px; color: var(--text-inv-2); }
    .chev { flex-shrink: 0; color: var(--text-inv-2); transition: transform .2s ease; }
    .chev.up { transform: rotate(180deg); }
    .changes { list-style: none; padding: 4px 22px 22px; margin: 0; display: grid; gap: 10px; }
    .changes li { position: relative; padding-left: 20px; font-size: 14px; line-height: 1.55; color: var(--text-inv-2); }
    .changes li::before { content: ""; position: absolute; left: 3px; top: 8px; width: 7px; height: 7px; border-radius: 50%;
      background: var(--gold-bright); box-shadow: 0 0 8px var(--gold-bright); }
    @media (max-width: 560px) {
      .wrap { padding: 30px 16px 40px; }
      .rel-head { padding: 15px 16px; flex-wrap: wrap; gap: 8px; }
      .rel-title { white-space: normal; flex-basis: 100%; order: 3; }
      .changes { padding: 4px 16px 18px; }
    }
  `],
})
export class ChatbotChangelogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly log = CHANGELOG;
  // Abierta solo la más nueva; las viejas arrancan cerradas.
  private readonly openSet = signal<Set<string>>(new Set(this.log.length ? [this.log[0].version] : []));

  anchor(v: string): string { return 'v' + v.replace(/\./g, '-'); }
  isOpen(v: string): boolean { return this.openSet().has(v); }
  toggle(v: string): void {
    const s = new Set(this.openSet());
    s.has(v) ? s.delete(v) : s.add(v);
    this.openSet.set(s);
  }

  ngOnInit(): void {
    // SEO / GEO / AIO: la página es pública e indexable; el subdominio maneja su propio meta.
    const title = 'Historial de versiones · Vectis AI ChatBot';
    const desc = 'Novedades y versiones de Vectis AI ChatBot: cada actualización del chatbot de IA multicanal para negocios — web, Telegram, agendado de citas con Cal.com y atención con agente.';
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: desc });
    try {
      const base = (typeof location !== 'undefined' && location.origin) || 'https://www.aichatbot.wearevectis.com';
      const href = base + '/changelog';
      this.meta.updateTag({ property: 'og:url', content: href });
      let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
      if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
      link.setAttribute('href', href);
    } catch (e) { /* noop */ }

    const frag = this.route.snapshot.fragment;
    if (frag) {
      // Abre la versión enlazada y hace scroll hacia ella.
      const match = this.log.find((e) => this.anchor(e.version) === frag);
      if (match) { const s = new Set(this.openSet()); s.add(match.version); this.openSet.set(s); }
      setTimeout(() => { try { document.getElementById(frag)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* noop */ } }, 120);
    }
  }
}
