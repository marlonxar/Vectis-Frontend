import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-refounds',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './refounds.component.html',
  styleUrl: './refounds.component.scss',
})
export class RefoundsComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translate = inject(TranslateService);
  private readonly scroll = inject(ScrollService);

  readonly sections = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

  ngOnInit(): void {
    this.translate.get(['REFUNDS.META_TITLE', 'REFUNDS.META_DESC']).subscribe((t: Record<string, string>) => {
      this.title.setTitle(t['REFUNDS.META_TITLE']);
      this.meta.updateTag({ name: 'description', content: t['REFUNDS.META_DESC'] });
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    });
    this.scroll.scrollToTop();
  }
}
