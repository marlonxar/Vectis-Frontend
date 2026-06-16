import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CountUpDirective } from '../../core/directives/count-up.directive';
import { RevealDirective } from '../../core/directives/reveal.directive';

interface Stat { value?: number; suffix?: string; prefix?: string; key: string; textKey?: string; }
interface Member { name: string; roleKey: string; photo: string; linkedin: string; github: string; }

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, TranslateModule, CountUpDirective, RevealDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  readonly values = ['PRECISION', 'SPEED', 'IMPACT', 'TRANSPARENCY'];
  readonly stats: Stat[] = [
    { key: 'WORLDWIDE',  textKey: 'WORLDWIDE_VAL' },
    { key: 'EXPERIENCE', value: 10, prefix: '+' },
    { key: 'RETENTION',  value: 98, suffix: '%' },
  ];
  readonly team: Member[] = [
    { name: 'Marlon Álvarez',    roleKey: 'ENG', photo: 'https://i.pravatar.cc/400?img=12', linkedin: 'https://www.linkedin.com/', github: 'https://github.com/' },
    { name: 'Guillermo Ramírez', roleKey: 'ENG', photo: 'https://i.pravatar.cc/400?img=33', linkedin: 'https://www.linkedin.com/', github: 'https://github.com/' },
    { name: 'Sergio Arce',       roleKey: 'OPS', photo: 'assets/images/sergio-arce.jpg', linkedin: 'https://www.linkedin.com/', github: 'https://github.com/' },
  ];
}
