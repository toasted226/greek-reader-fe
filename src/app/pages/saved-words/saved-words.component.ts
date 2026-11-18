import { Component, inject } from '@angular/core';
import { LemmaItem } from '../../analysis/lemma-item/lemma-item';
import { ActiveFilterPillsComponent } from '../../analysis/lemma-filter/active-filter-pills.component';
import { LemmaFilterComponent } from '../../analysis/lemma-filter/lemma-filter.component';
import { LemmaFilterState } from '../../analysis/lemma-filter/lemma-filter-state';
import { SavedWordsFilterService } from './saved-words-filter.service';

@Component({
  selector: 'app-saved-words',
  imports: [LemmaItem, LemmaFilterComponent, ActiveFilterPillsComponent],
  // The shared filter component and pill bar inject the abstract base; bind it
  // to the saved-words service. No page-level instance is created — this alias
  // resolves to the existing root singleton, so filter state still persists
  // across navigation exactly as before.
  providers: [{ provide: LemmaFilterState, useExisting: SavedWordsFilterService }],
  templateUrl: './saved-words.component.html',
  host: {
    class: 'block w-full',
  },
})
export class SavedWordsComponent {
  readonly filterService = inject(SavedWordsFilterService);
}
