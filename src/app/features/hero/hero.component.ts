import {
  Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MeshBackgroundService } from '../../core/services/mesh-background.service';
import { ScrollService } from '../../core/services/scroll.service';
import { TypewriterDirective } from '../../core/directives/typewriter.directive';
import { fadeInUp } from '../../shared/animations/page-animations';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, TranslateModule, TypewriterDirective],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  animations: [fadeInUp],
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mesh') meshCanvas?: ElementRef<HTMLCanvasElement>;
  private readonly mesh = inject(MeshBackgroundService);
  private readonly scroll = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  readonly codeWords = ['build()', 'automate()', 'integrate()', 'deploy.ai()', 'scale()'];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.meshCanvas) return;
    this.mesh.initCanvas(this.meshCanvas.nativeElement);
    this.observer = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting) this.mesh.resume(); else this.mesh.pause(); }
    }, { threshold: 0 });
    this.observer.observe(this.meshCanvas.nativeElement);
  }
  go(id: string): void { this.scroll.scrollToId(id); }
  ngOnDestroy(): void { this.observer?.disconnect(); this.mesh.destroy(); }
}
