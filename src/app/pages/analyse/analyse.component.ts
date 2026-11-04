import { Component } from '@angular/core';
import { Analysis } from '../../analysis/analysis';
import { InfoPanel } from '../../analysis/info-panel/info-panel';
import { ResizablePanelDirective } from '../../shared/directives/resizable-panel.directive';

@Component({
  selector: 'app-analyse',
  imports: [Analysis, InfoPanel, ResizablePanelDirective],
  templateUrl: './analyse.component.html',
  styleUrl: './analyse.component.css',
  host: {
    class: 'flex flex-col flex-1 w-full',
  },
})
export class AnalyseComponent {}
