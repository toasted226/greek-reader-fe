import { computed, inject, Injectable, signal } from '@angular/core';
import { LexiconEndpointsService, AnalyseResponse, LemmaResponse } from '../../api';

const SENTENCE_DELIMITERS = new Set(['.', ';', ';', '!', '?', '\n']);

export function extractSentenceForToken(
  tokens: AnalyseResponse[] | null,
  selectedToken: AnalyseResponse | null,
): string {
  if (!tokens || !selectedToken) {
    return '';
  }

  const index = tokens.indexOf(selectedToken);
  if (index === -1) {
    return '';
  }

  // Find start index by searching backward for the previous sentence delimiter
  let startIdx = 0;
  for (let i = index - 1; i >= 0; i--) {
    const t = tokens[i].token;
    if (!t.isWord && Array.from(t.text).some((ch) => SENTENCE_DELIMITERS.has(ch))) {
      startIdx = i + 1;
      break;
    }
  }

  // Find end index by searching forward for the next sentence delimiter
  let endIdx = tokens.length - 1;
  for (let i = index; i < tokens.length; i++) {
    const t = tokens[i].token;
    if (!t.isWord && Array.from(t.text).some((ch) => SENTENCE_DELIMITERS.has(ch))) {
      endIdx = i;
      break;
    }
  }

  return tokens
    .slice(startIdx, endIdx + 1)
    .map((item) => item.token.text)
    .join('')
    .trim();
}

@Injectable({
  providedIn: 'root',
})
export class AnalysisService {
  private readonly lexiconService = inject(LexiconEndpointsService);

  readonly inputText = signal('');
  readonly isLoading = signal(false);
  readonly tokens = signal<AnalyseResponse[] | null>(null);
  readonly selectedToken = signal<AnalyseResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly wordCount = computed(() => this.tokens()?.filter((t) => t.token.isWord).length ?? 0);

  readonly inflectedCount = computed(
    () =>
      this.tokens()?.filter(
        (t) => t.token.isWord && t.lemmas.length > 0 && t.lemmas.some((m) => m.forms.length > 0),
      ).length ?? 0,
  );

  readonly unmatchedCount = computed(
    () => this.tokens()?.filter((t) => t.token.isWord && t.lemmas.length == 0).length ?? 0,
  );

  readonly coverage = computed(() => (this.wordCount() - this.unmatchedCount()) / this.wordCount());

  readonly selectedSentence = computed(() =>
    extractSentenceForToken(this.tokens(), this.selectedToken()),
  );

  readonly selectedLemmas = computed<LemmaResponse[]>(() => this.selectedToken()?.lemmas ?? []);

  selectToken(token: AnalyseResponse): void {
    this.selectedToken.set(token);
  }

  clearAnalysis(): void {
    this.tokens.set(null);
    this.selectedToken.set(null);
    this.errorMessage.set(null);
  }

  analyseText(): void {
    const text = this.inputText().trim();
    if (!text || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.lexiconService.lexiconAnalysePost({ text }).subscribe({
      next: (response) => {
        this.tokens.set(response);
        const firstWord = response.find((item) => item.token.isWord);
        if (firstWord) {
          this.selectedToken.set(firstWord);
        } else {
          this.selectedToken.set(null);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message ?? 'Failed to analyse Greek text. Please try again.');
        this.isLoading.set(false);
      },
    });
  }
}
