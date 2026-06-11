import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CountUpDirective } from '../../core/directives/count-up.directive';
import { RevealDirective } from '../../core/directives/reveal.directive';

interface Stat { value: number; suffix: string; key: string; }
interface Member { name: string; roleKey: string; photo: string; linkedin: string; github: string; }

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslateModule, CountUpDirective, RevealDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  readonly values = ['PRECISION', 'SPEED', 'IMPACT', 'TRANSPARENCY'];
  readonly stats: Stat[] = [
    { value: 25, suffix: '+', key: 'COUNTRIES' },
    { value: 8,  suffix: '',  key: 'YEARS' },
    { value: 30, suffix: '+', key: 'TEAM' },
    { value: 98, suffix: '%', key: 'RETENTION' },
  ];
  readonly team: Member[] = [
    { name: 'Marlon Álvarez',    roleKey: 'ENG', photo: 'https://i.pravatar.cc/400?img=12', linkedin: 'https://www.linkedin.com/', github: 'https://github.com/' },
    { name: 'Guillermo Ramírez', roleKey: 'ENG', photo: 'https://i.pravatar.cc/400?img=33', linkedin: 'https://www.linkedin.com/', github: 'https://github.com/' },
    { name: 'Sergio Arce',       roleKey: 'OPS', photo: 'https://i.pravatar.cc/400?img=15', linkedin: 'https://www.linkedin.com/', github: 'https://github.com/' },
  ];
}
