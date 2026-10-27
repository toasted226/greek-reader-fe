import { Component, computed, input, inject } from '@angular/core';
import { LemmaResponse } from '../../../api';
import { InflectionTable } from '../inflection-table/inflection-table';
import { findMatchingForms } from '../inflection-utils';
import { SavedLemmasService } from '../saved-lemmas.service';

const removeDuplicates = <T>(arr: T[]): T[] => {
  return [...new Set(arr)];
};

const isGender = (feature: string): boolean => {
  return (feature === 'masculine') || (feature === 'feminine') || (feature === 'neuter');
};

@Component({
  selector: 'app-lemma-item',
  imports: [InflectionTable],
  templateUrl: './lemma-item.html',
  host: {
    class: 'block',
  },
})
export class LemmaItem {
  private readonly savedLemmas = inject(SavedLemmasService);
  readonly lemma = input.required<LemmaResponse>();
  readonly contextSentence = input.required<string>();
  readonly matchedWord = input('');
  readonly matchedForms = computed(() => findMatchingForms(this.lemma().forms, this.matchedWord()));

  isSaved(): boolean {
    return this.savedLemmas.isSaved(this.lemma());
  }

  toggleSaved(): void {
    this.savedLemmas.toggle(this.lemma(), this.contextSentence());
  }

  getGender(): string {
    const features = this.lemma()
      .forms.flatMap((f) => f.features)
      .filter(isGender);
    return removeDuplicates(features).join(" | ")
  }

  getArticleType(): string {
    if (this.lemma().pos !== 'article') {
      return '';
    }
    const features = this.lemma()
      .forms.flatMap((f) => f.features);
    if (features.includes('definite')) {
      return 'definite';
    }
    if (features.includes('indefinite')) {
      return 'indefinite';
    }
    return '';
  }
}
