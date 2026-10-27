import { Component, inject } from '@angular/core';
import { AnalysisService } from '../analysis.service';
import { LemmaItem } from '../lemma-item/lemma-item';

@Component({
  selector: 'app-info-panel',
  imports: [LemmaItem],
  templateUrl: './info-panel.html',
  host: {
    class: 'flex flex-col h-full w-full',
  },
})
export class InfoPanel {
  protected readonly analysisService = inject(AnalysisService);

  readonly selectedToken = this.analysisService.selectedToken;
  readonly selectedSentence = this.analysisService.selectedSentence;
  readonly selectedLemmas = this.analysisService.selectedLemmas;
}
