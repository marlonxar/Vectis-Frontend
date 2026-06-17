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
    { key: 'CUSTOM',     textKey: 'CUSTOM_VAL' },
    { key: 'EXPERIENCE', value: 10, prefix: '+' },
    { key: 'SENIOR',     textKey: 'SENIOR_VAL' },
  ];
  readonly team: Member[] = [
    { name: 'Sergio Arce',       roleKey: 'CEO', photo: 'assets/images/sergio-arce.jpg', linkedin: 'https://www.linkedin.com/', github: 'https://github.com/' },
    { name: 'Marlon Álvarez',    roleKey: 'ENG', photo: 'assets/images/marlon-alvarez.jpg', linkedin: 'https://www.linkedin.com/', github: 'https://github.com/' },
    { name: 'Guillermo Ramírez', roleKey: 'ENG', photo: 'assets/images/guillermo-ramirez.jpg', linkedin: 'https://www.linkedin.com/', github: 'https://github.com/' },
  ];
}
