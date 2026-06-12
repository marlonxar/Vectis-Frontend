import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
})
export class IntroComponent implements AfterViewInit {
  @ViewChild('introContainer', { static: true }) introContainer!: ElementRef;

  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.startBounceExperience();
      }, 20);
    }
  }

  startBounceExperience() {
    const ball = document.querySelector('.glass-sphere');
    const shadow = document.querySelector('.floor-shadow');
    const loadingText = document.querySelector('.loading-text');
    const vectisText = document.querySelector('.vectis-reveal');
    const brandTitle = document.querySelector('.brand-title');

    const p1 = document.querySelector('.p1');
    const p2 = document.querySelector('.p2');
    const p3 = document.querySelector('.p3');
    const p4 = document.querySelector('.p4');

    if (!ball || !shadow) {
      return;
    }

    // Reset de seguridad limpio anti-caché
    gsap.set(ball, { y: -450, opacity: 0, scale: 1, scaleX: 1, scaleY: 1, force3D: true });
    gsap.set(shadow, { scale: 0, opacity: 0, force3D: true });
    if (vectisText) {
      gsap.set(vectisText, { transform: 'translate(-50%, -50%) scale(0.01)', opacity: 0 });
    }
    if (brandTitle) {
      gsap.set(brandTitle, { textContent: 'BIENVENIDO', opacity: 0.8 });
    }

    // LÍNEA DE TIEMPO SECUENCIAL ORIGINAL SÍNCRONA
    const tl = gsap.timeline({
      onComplete: () => this.exitIntro(),
    });

    // 1. CAÍDA INICIAL (Español activo por defecto)
    tl.to(ball, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.in', force3D: true }, 0).to(
      shadow,
      { scale: 1, opacity: 0.8, duration: 0.55, ease: 'power2.in', force3D: true },
      0,
    );

    // 2. REBOTE 1 (Alto)
    tl.to(ball, {
      scaleY: 0.6,
      scaleX: 1.3,
      duration: 0.07,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut',
    })
      // Transición controlada a Inglés durante el ascenso
      .to(brandTitle, { opacity: 0, duration: 0.15, ease: 'power1.inOut' }, '<')
      .set(brandTitle, { textContent: 'WELCOME' })
      .to(brandTitle, { opacity: 0.8, duration: 0.15, ease: 'power1.inOut' })
      .to(ball, { y: -160, duration: 0.45, ease: 'power1.out', force3D: true }, '<')
      .to(
        shadow,
        { scale: 0.3, opacity: 0.2, duration: 0.45, ease: 'power1.out', force3D: true },
        '<',
      )
      .to(ball, { y: 0, duration: 0.42, ease: 'power1.in', force3D: true })
      .to(
        shadow,
        { scale: 1, opacity: 0.8, duration: 0.42, ease: 'power1.in', force3D: true },
        '<',
      );

    // 3. REBOTE 2 (Medio)
    tl.to(ball, {
      scaleY: 0.75,
      scaleX: 1.15,
      duration: 0.06,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut',
    })
      // Transición controlada a Francés durante el segundo ascenso
      .to(brandTitle, { opacity: 0, duration: 0.12, ease: 'power1.inOut' }, '<')
      .set(brandTitle, { textContent: 'BIENVENUE' })
      .to(brandTitle, { opacity: 0.8, duration: 0.12, ease: 'power1.inOut' })
      .to(ball, { y: -70, duration: 0.35, ease: 'power1.out', force3D: true }, '<')
      .to(
        shadow,
        { scale: 0.5, opacity: 0.3, duration: 0.35, ease: 'power1.out', force3D: true },
        '<',
      )
      .to(ball, { y: 0, duration: 0.32, ease: 'power1.in', force3D: true })
      .to(
        shadow,
        { scale: 1, opacity: 0.8, duration: 0.32, ease: 'power1.in', force3D: true },
        '<',
      );

    // 4. REBOTE 3 (Corto Asentamiento)
    tl.to(ball, {
      scaleY: 0.9,
      scaleX: 1.05,
      duration: 0.05,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut',
    })
      .to(ball, { y: -20, duration: 0.22, ease: 'power1.out', force3D: true })
      .to(
        shadow,
        { scale: 0.7, opacity: 0.5, duration: 0.22, ease: 'power1.out', force3D: true },
        '<',
      )
      .to(ball, { y: 0, duration: 0.2, ease: 'power1.in', force3D: true })
      .to(shadow, { scale: 1, opacity: 0.8, duration: 0.2, ease: 'power1.in', force3D: true }, '<');

    // --- SECUENCIA DE EXPLOSIÓN LIMPIA ---
    if (brandTitle && loadingText) {
      tl.to([brandTitle, loadingText], { opacity: 0, duration: 0.15 });
    }

    tl.to({}, { duration: 0.1 });

    // A) Estallido de la burbuja
    tl.to(ball, {
      scale: 2.5,
      opacity: 0,
      filter: 'contrast(200%) brightness(130%)',
      duration: 0.14,
      ease: 'power3.out',
      force3D: true,
    }).to(shadow, { scale: 0, opacity: 0, duration: 0.12, ease: 'power3.out' }, '<');

    // B) Lanzamiento de partículas de cristal doradas
    if (p1 && p2 && p3 && p4) {
      tl.to(
        p1,
        { x: -140, y: -140, opacity: 1, scale: 0.4, duration: 0.18, ease: 'power4.out' },
        '<',
      )
        .to(
          p2,
          { x: 120, y: -140, opacity: 1, scale: 0.4, duration: 0.18, ease: 'power4.out' },
          '<',
        )
        .to(
          p3,
          { x: -100, y: 100, opacity: 1, scale: 0.4, duration: 0.18, ease: 'power4.out' },
          '<',
        )
        .to(
          p4,
          { x: 130, y: 110, opacity: 1, scale: 0.4, duration: 0.18, ease: 'power4.out' },
          '<',
        );

      tl.to([p1, p2, p3, p4], { opacity: 0, scale: 0, duration: 0.15, ease: 'power2.in' });
    }

    // C) "WE ARE VECTIS" explota escalándose masivamente de forma responsive
    if (vectisText) {
      tl.to(
        vectisText,
        {
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
          duration: 0.4,
          ease: 'back.out(1.5)',
          force3D: true,
        },
        '<',
      );

      tl.to(
        vectisText,
        {
          transform: 'translate(-50%, -50%) scale(9)',
          opacity: 0,
          duration: 0.8,
          ease: 'power2.in',
          force3D: true,
        },
        '+=0.4',
      );
    }
  }

  exitIntro() {
    if (isPlatformBrowser(this.platformId)) {
      gsap.to(this.introContainer.nativeElement, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          this.introContainer.nativeElement.style.display = 'none';
          // Trigger custom reveal animation event for projects
          const event = new CustomEvent('intro-finished');
          window.dispatchEvent(event);
        },
      });
    }
  }
}
