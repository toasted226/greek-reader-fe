import { Component, inject, input } from '@angular/core';
import { AnalyseResponse } from '../../api';
import { Token } from './token/token';
import { AnalysisService } from './analysis.service';
import { PercentPipe } from '@angular/common';
import { AnalysisLoadingSkeleton } from './analysis-loading-skeleton';

@Component({
  imports: [Token, PercentPipe, AnalysisLoadingSkeleton],
  selector: 'app-analysis',
  styleUrl: './analysis.css',
  templateUrl: './analysis.html',
})
export class Analysis {
  readonly showInput = input<boolean>(true);
  readonly showEditText = input<boolean>(true);
  readonly loading = input<boolean>(false);

  protected readonly analysisService = inject(AnalysisService);

  readonly inputText = this.analysisService.inputText;
  readonly isLoading = this.analysisService.isLoading;
  readonly tokens = this.analysisService.tokens;
  readonly selectedToken = this.analysisService.selectedToken;
  readonly errorMessage = this.analysisService.errorMessage;
  readonly wordCount = this.analysisService.wordCount;
  readonly inflectedCount = this.analysisService.inflectedCount;
  readonly unmatchedCount = this.analysisService.unmatchedCount;
  readonly coverage = this.analysisService.coverage;

  selectToken(token: AnalyseResponse): void {
    this.analysisService.selectToken(token);
  }

  clearAnalysis(): void {
    this.analysisService.clearAnalysis();
  }

  analyseText(): void {
    this.analysisService.analyseText();
  }
}
