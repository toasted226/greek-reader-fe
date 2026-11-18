import { Component, computed, inject, input } from '@angular/core';
import { buildFilterPills } from './active-filter-pills';
import { LemmaFilterState } from './lemma-filter-state';

/**
 * Active-filter summary shared by the Saved Words and Dictionary pages.
 * Resolves its state through the abstract `LemmaFilterState`, so each page's
 * providers decide which concrete filter service it reflects.
 */
@Component({
  selector: 'app-active-filter-pills',
  templateUrl: './active-filter-pills.component.html',
  host: {
    class: 'block',
  },
})
export class ActiveFilterPillsComponent {
  /** Whether saved-on date pills are relevant on this surface. */
  readonly showDates = input(true);

  /** Whether the "Latest only" pill is relevant on this surface. */
  readonly showLatest = input(true);

  private readonly filterService = inject(LemmaFilterState);

  readonly hasActiveFilters = this.filterService.hasActiveFilters;

  readonly pills = computed(() =>
    buildFilterPills(this.filterService, {
      showDates: this.showDates(),
      showLatest: this.showLatest(),
    }),
  );

  clearAll(): void {
    this.filterService.clearFilters();
  }
}
