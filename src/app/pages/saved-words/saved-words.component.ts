import { Component, computed, inject } from '@angular/core';
import { POS_LABELS, featureLabel } from '../../analysis/filter-features';
import { LemmaItem } from '../../analysis/lemma-item/lemma-item';
import { SavedWordsFilterComponent } from './saved-words-filter/saved-words-filter.component';
import { SavedWordsFilterService } from './saved-words-filter.service';

export interface ActiveFilterPill {
  /** Unique key used for tracking in @for. */
  id: string;
  /** Human-readable label shown inside the pill. */
  label: string;
  /** Called when the user dismisses this pill. */
  remove: () => void;
}

@Component({
  selector: 'app-saved-words',
  imports: [LemmaItem, SavedWordsFilterComponent],
  templateUrl: './saved-words.component.html',
  host: {
    class: 'block w-full',
  },
})
export class SavedWordsComponent {
  readonly filterService = inject(SavedWordsFilterService);

  /** Ordered list of pills representing every currently active filter. */
  readonly activeFilterPills = computed<ActiveFilterPill[]>(() => {
    const pills: ActiveFilterPill[] = [];
    const fs = this.filterService;

    if (fs.lemmaSearch()) {
      pills.push({
        id: 'lemma',
        label: `Lemma: "${fs.lemmaSearch()}"`,
        remove: () => { fs.lemmaSearch.set(''); fs.lemmaInput$.next(''); },
      });
    }

    if (fs.formSearch()) {
      pills.push({
        id: 'form',
        label: `Form: "${fs.formSearch()}"`,
        remove: () => { fs.formSearch.set(''); fs.formInput$.next(''); },
      });
    }

    if (fs.partOfSpeech()) {
      const pos = fs.partOfSpeech()!;
      pills.push({
        id: 'pos',
        label: POS_LABELS[pos] ?? pos,
        remove: () => fs.setPartOfSpeech(null),
      });
    }

    for (const key of fs.selectedFeatures()) {
      pills.push({
        id: `feature-${key}`,
        label: featureLabel(key),
        remove: () => fs.toggleFeature(key),
      });
    }

    if (fs.minDate()) {
      pills.push({
        id: 'minDate',
        label: `From: ${fs.minDate()!.toLocaleDateString()}`,
        remove: () => fs.minDate.set(null),
      });
    }

    if (fs.maxDate()) {
      pills.push({
        id: 'maxDate',
        label: `To: ${fs.maxDate()!.toLocaleDateString()}`,
        remove: () => fs.maxDate.set(null),
      });
    }

    if (fs.latest()) {
      pills.push({
        id: 'latest',
        label: 'Latest only',
        remove: () => fs.latest.set(false),
      });
    }

    if (fs.exampleSearch()) {
      pills.push({
        id: 'example',
        label: `Context: "${fs.exampleSearch()}"`,
        remove: () => { fs.exampleSearch.set(''); fs.exampleInput$.next(''); },
      });
    }

    return pills;
  });
}
