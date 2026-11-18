import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LemmaItem } from '../../analysis/lemma-item/lemma-item';
import { ActiveFilterPillsComponent } from '../../analysis/lemma-filter/active-filter-pills.component';
import { LemmaFilterComponent } from '../../analysis/lemma-filter/lemma-filter.component';
import { LemmaFilterState } from '../../analysis/lemma-filter/lemma-filter-state';
import { DictionaryFilterService } from './dictionary-filter.service';

@Component({
  selector: 'app-dictionary',
  imports: [LemmaItem, LemmaFilterComponent, ActiveFilterPillsComponent],
  providers: [
    DictionaryFilterService,
    // The shared filter/pill components inject the abstract base; each page binds
    // it to its own concrete service. Dictionary is page-scoped: fresh filter
    // state per visit.
    { provide: LemmaFilterState, useExisting: DictionaryFilterService },
  ],
  templateUrl: './dictionary.component.html',
  host: {
    class: 'block w-full',
  },
})
export class DictionaryComponent {
  readonly filterService = inject(DictionaryFilterService);
  private readonly document = inject(DOCUMENT);

  next(): void {
    this.filterService.next();
    this.scrollToTop();
  }

  previous(): void {
    this.filterService.previous();
    this.scrollToTop();
  }

  private scrollToTop(): void {
    // Assigning scrollTop directly keeps this safe in SSR and unit tests,
    // where window.scrollTo may be missing or a no-op.
    this.document.documentElement.scrollTop = 0;
  }
}
