import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, catchError, finalize } from 'rxjs';
import { LexiconEndpointsService, UserLemmaResponse } from '../../../api';
import { LemmaFilterQuery, LemmaFilterState } from '../../analysis/lemma-filter/lemma-filter-state';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class SavedWordsFilterService extends LemmaFilterState {
  private readonly endpoints = inject(LexiconEndpointsService);

  // ── List result state ────────────────────────────────────────────────────

  private readonly savedLemmasSignal = signal<UserLemmaResponse[]>([]);
  readonly savedLemmas = this.savedLemmasSignal.asReadonly();

  constructor() {
    super();
    // Initial load with no filters. Runs here — after this subclass's fields
    // are initialised — because performFetch writes `savedLemmasSignal`.
    this.refresh();
  }

  /**
   * Fetches the filtered lemma list through the generated
   * `LexiconEndpointsService.lemmasGet()` client.
   *
   * Empty filters are passed as `undefined` so they are omitted from the query
   * string rather than sent as empty values. `latest` is likewise only sent
   * when true (the API treats its absence as false).
   *
   * `minDate`/`maxDate` are date-only query parameters (`format: date`, bound
   * to `DateOnly` server-side), so they are formatted as `YYYY-MM-DD` — the
   * generated client accepts them as `string` because `openapi.config.ts`
   * generates with `dateType: 'string'`.
   */
  protected performFetch(params: LemmaFilterQuery): void {
    this.loadingSignal.set(true);
    this.loadErrorSignal.set(false);

    this.endpoints
      .lemmasGet(
        params.pos ?? undefined,
        params.lemma || undefined,
        params.form || undefined,
        params.example || undefined,
        params.features.length > 0 ? params.features.join(',') : undefined,
        params.minDate ? this.toDateParam(params.minDate) : undefined,
        params.maxDate ? this.toDateParam(params.maxDate) : undefined,
        params.latest || undefined,
      )
      .pipe(
        catchError(() => {
          this.loadErrorSignal.set(true);
          return EMPTY;
        }),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe((lemmas) => this.savedLemmasSignal.set(lemmas));
  }

  /** Formats a date-input value as the API's date-only wire format (YYYY-MM-DD). */
  private toDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
