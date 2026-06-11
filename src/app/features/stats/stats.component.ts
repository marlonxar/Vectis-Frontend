import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CountUpDirective } from '../../core/directives/count-up.directive';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, TranslateModule, CountUpDirective],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent {}
