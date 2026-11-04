import { Component } from '@angular/core';

@Component({
  selector: 'app-analysis-loading-skeleton',
  template: `
    <div class="flex flex-wrap gap-1.5 pt-1 animate-pulse" aria-hidden="true">
      @for (_ of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; track $index) {
        <div class="h-7 rounded-md bg-surface-sunken" [style.width.px]="40 + ($index % 5) * 18"></div>
      }
    </div>
  `,
})
export class AnalysisLoadingSkeleton {}
