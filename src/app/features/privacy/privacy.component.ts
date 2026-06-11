import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translate = inject(TranslateService);
  private readonly scroll = inject(ScrollService);

  readonly sections = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];

  ngOnInit(): void {
    this.translate.get(['PRIVACY.META_TITLE', 'PRIVACY.META_DESC']).subscribe((t: Record<string, string>) => {
      this.title.setTitle(t['PRIVACY.META_TITLE']);
      this.meta.updateTag({ name: 'description', content: t['PRIVACY.META_DESC'] });
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    });
    this.scroll.scrollToTop();
  }
}
