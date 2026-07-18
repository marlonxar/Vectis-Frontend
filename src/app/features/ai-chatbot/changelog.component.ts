import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotVersionFooterComponent } from './version-footer.component';
import { CHANGELOG } from './version';

/** /changelog — Historial de versiones (novedades) del producto. */
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
              <li class="rel" [id]="anchor(e.version)">
                <div class="rel-head">
                  <span class="ver">v{{ e.version }}</span>
                  <span class="date">{{ e.date }}</span>
                  @if (first) { <span class="latest">Actual</span> }
                </div>
                <h2 class="rel-title">{{ e.title }}</h2>
                <ul class="changes">
                  @for (c of e.changes; track c) { <li>{{ c }}</li> }
                </ul>
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
    .rels { list-style: none; padding: 0; margin: 30px 0 0; display: grid; gap: 18px; }
    .rel { position: relative; scroll-margin-top: 24px; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 22px 24px; }
    .rel:target { border-color: rgba(231,171,46,.5); box-shadow: 0 0 0 3px rgba(231,171,46,.12); }
    .rel-head { display: flex; align-items: center; gap: 12px; }
    .ver { font-size: 18px; font-weight: 800; color: var(--gold-bright); font-variant-numeric: tabular-nums; }
    .date { font-size: 12.5px; color: var(--text-inv-2); }
    .latest { margin-left: auto; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
      color: var(--gold-bright); background: rgba(231,171,46,.12); border: 1px solid rgba(231,171,46,.3); border-radius: 999px; padding: 4px 10px; }
    .rel-title { font-size: 17px; margin: 12px 0 12px; }
    .changes { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
    .changes li { position: relative; padding-left: 20px; font-size: 14px; line-height: 1.55; color: var(--text-inv-2); }
    .changes li::before { content: ""; position: absolute; left: 3px; top: 8px; width: 7px; height: 7px; border-radius: 50%;
      background: var(--gold-bright); box-shadow: 0 0 8px var(--gold-bright); }
    @media (max-width: 560px) { .wrap { padding: 30px 16px 40px; } .rel { padding: 18px 16px; } }
  `],
})
export class ChatbotChangelogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  readonly log = CHANGELOG;

  anchor(v: string): string { return 'v' + v.replace(/\./g, '-'); }

  ngOnInit(): void {
    this.title.setTitle('Historial de versiones · Vectis AI ChatBot');
    const frag = this.route.snapshot.fragment;
    if (frag) setTimeout(() => { try { document.getElementById(frag)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* noop */ } }, 120);
  }
}
