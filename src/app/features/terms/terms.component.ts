import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss',
})
export class TermsComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translate = inject(TranslateService);
  private readonly scroll = inject(ScrollService);

  readonly sections = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];

  ngOnInit(): void {
    this.translate.get(['TERMS.META_TITLE', 'TERMS.META_DESC']).subscribe((t: Record<string, string>) => {
      this.title.setTitle(t['TERMS.META_TITLE']);
      this.meta.updateTag({ name: 'description', content: t['TERMS.META_DESC'] });
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    });
    this.scroll.scrollToTop();
  }
}
