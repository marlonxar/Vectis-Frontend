import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, OnDestroy, Output, inject } from '@angular/core';

/**
 * Atrapa el foco dentro de un modal y restaura el foco previo al cerrarlo.
 * Emite (dismiss) al presionar Escape para que el contenedor cierre el diálogo.
 * Uso: <div role="dialog" appFocusTrap (dismiss)="close()"> ... </div>
 */
@Directive({ selector: '[appFocusTrap]', standalone: true })
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  @Output() dismiss = new EventEmitter<void>();
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private prev: HTMLElement | null = null;

  ngAfterViewInit(): void {
    if (typeof document === 'undefined') return;
    this.prev = (document.activeElement as HTMLElement) ?? null;
    queueMicrotask(() => this.focusFirst());
  }

  ngOnDestroy(): void {
    try { this.prev?.focus?.(); } catch { /* noop */ }
  }

  private focusable(): HTMLElement[] {
    const sel = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(sel))
      .filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  private focusFirst(): void {
    const f = this.focusable();
    (f[0] ?? this.host.nativeElement).focus();
  }

  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') { e.preventDefault(); this.dismiss.emit(); return; }
    if (e.key !== 'Tab') return;
    const f = this.focusable();
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    const active = document.activeElement as HTMLElement;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }
}
