import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, catchError, finalize } from 'rxjs';
import { LexiconEndpointsService, LemmaResponse } from '../../../api';
import { LemmaFilterQuery, LemmaFilterState } from '../../analysis/lemma-filter/lemma-filter-state';

/** Results per page on the Dictionary surface (API default is 50). */
export const DICTIONARY_PAGE_SIZE = 20;

/**
 * Filter + pagination state for the Dictionary page.
 *
 * Extends the shared `LemmaFilterState` machinery and fetches through the
 * paginated `GET /lexicon/query` endpoint. Differences from the saved-words
 * surface:
 * - the form filter is sent as `formContains` (substring match) rather than
 *   exact `form` — substring suits dictionary browsing;
 * - results are paginated: every filter change resets to the first page,
 *   while `refresh()` retries the page currently shown.
 */
@Injectable()
export class DictionaryFilterService extends LemmaFilterState {
  private readonly endpoints = inject(LexiconEndpointsService);

  readonly pageSize = DICTIONARY_PAGE_SIZE;

  // ── Page result state ────────────────────────────────────────────────────

  private readonly itemsSignal = signal<LemmaResponse[]>([]);
  private readonly totalSignal = signal(0);
  private readonly offsetSignal = signal(0);

  readonly items = this.itemsSignal.asReadonly();
  readonly total = this.totalSignal.asReadonly();
  /** Zero-based offset of the first item on the current page. */
  readonly offset = this.offsetSignal.asReadonly();

  // ── Derived pagination state ─────────────────────────────────────────────

  readonly canGoPrevious = computed(() => this.offset() > 0);
  readonly canGoNext = computed(() => this.offset() + this.items().length < this.total());
  readonly firstItemNumber = computed(() => (this.items().length === 0 ? 0 : this.offset() + 1));
  readonly lastItemNumber = computed(() => this.offset() + this.items().length);

  constructor() {
    super();
    // Initial load: first page, no filters. Runs here — after this subclass's
    // fields are initialised — because performFetch writes `itemsSignal`.
    this.refresh();
  }

  next(): void {
    if (!this.canGoNext()) return;
    this.offsetSignal.update((current) => current + DICTIONARY_PAGE_SIZE);
    this.refresh();
  }

  previous(): void {
    if (!this.canGoPrevious()) return;
    this.offsetSignal.update((current) => Math.max(0, current - DICTIONARY_PAGE_SIZE));
    this.refresh();
  }

  /**
   * Re-fetches the page currently shown, with the current filters. Overrides
   * the base's page-1 semantics because the Dictionary keeps its offset
   * across retries (e.g. "Try again" after a failed page load).
   */
  override refresh(): void {
    this.fetchPage(this.allFilters(), this.offsetSignal());
  }

  /**
   * Fetches through the generated `LexiconEndpointsService.lexiconQueryGet()`
   * client. Called by the base on every filter change — so the page resets to
   * the first page whenever a filter changes.
   *
   * The form filter maps to `formContains` (substring, normalised through the
   * morphology engine); the exact-`form` parameter is never sent. Empty
   * filters are passed as `undefined` so they are omitted from the query
   * string rather than sent as empty values.
   */
  protected performFetch(query: LemmaFilterQuery): void {
    this.offsetSignal.set(0);
    this.fetchPage(query, 0);
  }

  private fetchPage(query: LemmaFilterQuery, offset: number): void {
    this.loadingSignal.set(true);
    this.loadErrorSignal.set(false);

    this.endpoints
      .lexiconQueryGet(
        query.pos ?? undefined,
        query.lemma || undefined,
        undefined, // exact form — Dictionary browses by substring instead
        query.form || undefined, // formContains
        query.example || undefined,
        query.features.length > 0 ? query.features.join(',') : undefined,
        offset,
        DICTIONARY_PAGE_SIZE,
      )
      .pipe(
        catchError(() => {
          this.loadErrorSignal.set(true);
          return EMPTY;
        }),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe((page) => {
        this.itemsSignal.set(page.items);
        this.totalSignal.set(Number(page.total));
        this.offsetSignal.set(Number(page.offset));
      });
  }
}
