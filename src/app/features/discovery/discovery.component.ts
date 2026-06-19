import { Component, ElementRef, ViewChild, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

interface DiscoveryAssistantApi { init: (cfg: { key: string; target: string; page: boolean }) => void; }

/**
 * Full-page host for the Discovery Assistant widget.
 * Reachable only via /discovery-assistant/:id and /asistente-de-descubrimiento/:id.
 * Lazy-loaded, so the widget script only loads when one of those paths is visited.
 */
@Component({
  selector: 'app-discovery',
  standalone: true,
  template: `<div #host class="da-host" [id]="hostId"></div>`,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 10000; display: block; overflow: auto; background: #0a1024; }
    .da-host { min-height: 100%; }
  `],
})
export class DiscoveryComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;
  readonly hostId = 'da-page-host-' + Math.random().toString(36).slice(2, 8);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (!id) return;
    const target = '#' + this.hostId;
    const win = window as unknown as { DiscoveryAssistant?: DiscoveryAssistantApi };
    const run = () => { win.DiscoveryAssistant?.init({ key: id, target, page: true }); };

    if (win.DiscoveryAssistant) { run(); return; }
    let s = document.querySelector('script[data-da-widget]') as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement('script');
      s.src = '/assets/discovery/widget.js';
      s.async = true;
      s.setAttribute('data-da-widget', '');
      document.body.appendChild(s);
    }
    s.addEventListener('load', run);
    if (win.DiscoveryAssistant) run();
  }
}
