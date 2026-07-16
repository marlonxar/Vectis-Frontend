import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

interface DiscoveryAssistantApi { init: (cfg: { key: string; target: string; page: boolean }) => void; }

/**
 * Full-page host for the Discovery Assistant widget.
 * Reachable only via /discovery-assistant/:id (and aliases). Lazy-loaded so the
 * widget JS only downloads when one of those paths is visited.
 *
 * The widget itself lives in a Shadow DOM (good isolation, but invisible to
 * crawlers/AI engines), so we render an accessible, indexable text fallback in
 * light DOM for SEO / GEO / AIO and screen readers.
 */
@Component({
  selector: 'app-discovery',
  standalone: true,
  template: `
    <!-- Accessible + crawlable fallback (visually hidden; the widget covers the screen) -->
    <section class="da-seo">
      <h1>Discovery Assistant de Vectis</h1>
      <p>
        Cuéntanos sobre tu proyecto y recibe una propuesta a medida. Responde unas pocas preguntas
        sobre tu sitio web, automatización o software y el equipo de Vectis Automation
        (San José, Costa Rica) te contactará con los siguientes pasos.
      </p>
      <noscript>
        Este asistente necesita JavaScript. Escríbenos a
        <a href="mailto:contact&#64;wearevectis.com">contact&#64;wearevectis.com</a>
        o visita <a href="https://www.wearevectis.com/">wearevectis.com</a>.
      </noscript>
    </section>
    <div #host class="da-host" [id]="hostId" role="application" aria-label="Discovery Assistant"></div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 10000; display: block; overflow: hidden; background: #060509; }
    .da-host { height: 100%; }
    /* visible to assistive tech + crawlers, not to sighted users */
    .da-seo { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0; }
  `],
})
export class DiscoveryComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;
  readonly hostId = 'da-page-host-' + Math.random().toString(36).slice(2, 8);

  private readonly SUPABASE_ORIGIN = 'https://cqblywvdveetrhwbytmh.supabase.co';
  private addedHead: HTMLElement[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const url = `https://www.wearevectis.com/discovery-assistant/${id}`;
    const t = 'Discovery Assistant — Cuéntanos tu proyecto | Vectis';
    const d = 'Asistente de descubrimiento de Vectis Automation: responde unas preguntas y recibe una propuesta a medida para tu sitio web, automatización con IA o software. San José, Costa Rica, para clientes en todo el mundo.';

    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description', content: d });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });

    if (!isPlatformBrowser(this.platformId)) return;

    this.addCanonical(url);
    // JSON-LD (GEO / AIO): describe the assistant as a WebApplication of the org
    this.addJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Discovery Assistant',
      url,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: ['es', 'en'],
      description: d,
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: { '@type': 'Organization', name: 'Vectis Automation', url: 'https://www.wearevectis.com/' },
    });
    // warm up the API connection before the widget makes its first request
    this.addPreconnect(this.SUPABASE_ORIGIN);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (!id) return;
    const target = '#' + this.hostId;
    const win = window as unknown as { DiscoveryAssistant?: DiscoveryAssistantApi };
    const run = () => win.DiscoveryAssistant?.init({ key: id, target, page: true });

    if (win.DiscoveryAssistant) { run(); return; }
    let s = this.doc.querySelector('script[data-da-widget]') as HTMLScriptElement | null;
    if (!s) {
      s = this.doc.createElement('script');
      s.src = '/assets/discovery/widget.js';
      s.defer = true;
      s.setAttribute('data-da-widget', '');
      this.doc.body.appendChild(s);
    }
    s.addEventListener('load', run);
    if (win.DiscoveryAssistant) run();
  }

  ngOnDestroy(): void {
    this.addedHead.forEach((el) => el.remove());
    this.addedHead = [];
  }

  private addCanonical(href: string): void {
    let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const created = !link;
    if (!link) { link = this.doc.createElement('link'); link.rel = 'canonical'; }
    link.href = href;
    if (created) { this.doc.head.appendChild(link); this.addedHead.push(link); }
  }

  private addPreconnect(href: string): void {
    const link = this.doc.createElement('link');
    link.rel = 'preconnect'; link.href = href; link.crossOrigin = 'anonymous';
    this.doc.head.appendChild(link); this.addedHead.push(link);
  }

  private addJsonLd(data: unknown): void {
    const s = this.doc.createElement('script');
    s.type = 'application/ld+json'; s.setAttribute('data-da-jsonld', '');
    s.textContent = JSON.stringify(data);
    this.doc.head.appendChild(s); this.addedHead.push(s);
  }
}
