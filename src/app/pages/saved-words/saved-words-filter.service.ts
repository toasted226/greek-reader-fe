import {
  Injectable,
  Injector,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, debounceTime } from 'rxjs';
import { EMPTY, catchError, distinctUntilChanged, finalize, map, of, skip, switchMap } from 'rxjs';
import { BASE_PATH_DEFAULT } from '../../../api/tokens';
import { UserLemmaResponse } from '../../../api';
import { FeatureEntry, buildFeatureEntries } from '../../analysis/filter-features';
import { FeatureCatalogService } from '../../analysis/feature-catalog.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavedWordsFilters {
  lemmaSearch: string;
  formSearch: string;
  exampleSearch: string;
  partOfSpeech: string | null;
  selectedFeatures: string[];
  minDate: Date | null;
  maxDate: Date | null;
  latest: boolean;
}

const EMPTY_FILTERS: SavedWordsFilters = {
  lemmaSearch: '',
  formSearch: '',
  exampleSearch: '',
  partOfSpeech: null,
  selectedFeatures: [],
  minDate: null,
  maxDate: null,
  latest: false,
};

/**
 * The feature list resolved for a specific part of speech.
 *
 * Carries the `pos` it belongs to so a stale response can never be applied to a
 * different selection (the `switchMap` below normally cancels it first, but the
 * guard makes the render correct regardless).
 */
interface PosFeatureState {
  pos: string | null;
  features: readonly string[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class SavedWordsFilterService {
  private readonly httpClient = inject(HttpClient);
  private readonly basePath = inject(BASE_PATH_DEFAULT);
  private readonly injector = inject(Injector);
  private readonly featureCatalog = inject(FeatureCatalogService);

  // ── List result state ────────────────────────────────────────────────────

  private readonly savedLemmasSignal = signal<UserLemmaResponse[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly loadErrorSignal = signal(false);

  readonly savedLemmas = this.savedLemmasSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loadError = this.loadErrorSignal.asReadonly();

  // ── Filter state (individual signals for granular reactivity) ────────────

  readonly lemmaSearch = signal('');
  readonly formSearch = signal('');
  readonly exampleSearch = signal('');
  readonly partOfSpeech = signal<string | null>(null);
  readonly selectedFeatures = signal<string[]>([]);
  readonly minDate = signal<Date | null>(null);
  readonly maxDate = signal<Date | null>(null);
  readonly latest = signal(false);

  // ── Derived state ────────────────────────────────────────────────────────

  readonly hasActiveFilters = computed(() =>
    this.lemmaSearch() !== '' ||
    this.formSearch() !== '' ||
    this.exampleSearch() !== '' ||
    this.partOfSpeech() !== null ||
    this.selectedFeatures().length > 0 ||
    this.minDate() !== null ||
    this.maxDate() !== null ||
    this.latest(),
  );

  // ── Feature catalog state ────────────────────────────────────────────────
  // The API is the authority on which features exist and which apply to a
  // given part of speech. `FeatureCatalogService` caches both per key, so the
  // requests below are free after the first one.

  /** Every feature the API knows about — renders the chip row. */
  private readonly universeFeatures = signal<readonly string[]>([]);

  /** Features resolved for a specific POS (guarded by `pos`). */
  private readonly posFeatures = signal<PosFeatureState | null>(null);

  /**
   * The feature chips for the current filter state.
   *
   * The chip row is the API's full catalog, so it keeps its shape when a POS is
   * selected; features outside the selected POS's list stay visible but are
   * greyed out (`enabled: false`). While a POS list is in flight the chips are
   * rendered disabled rather than optimistically enabled — see
   * `featuresLoading` — so an inapplicable feature can't be selected before the
   * API answers.
   */
  readonly availableFeatures = computed<FeatureEntry[]>(() => {
    const pos = this.partOfSpeech();
    const state = this.posFeatures();
    const applicable =
      pos === null ? null : state?.pos === pos ? state.features : [];
    return buildFeatureEntries(this.universeFeatures(), applicable);
  });

  /** True while the feature list for the current POS has not resolved yet. */
  readonly featuresLoading = computed(() => {
    const state = this.posFeatures();
    return state === null || state.pos !== this.partOfSpeech();
  });

  /** Snapshot of all filter values as a plain object — watched by toObservable(). */
  private readonly allFilters = computed(() => ({
    lemma:    this.lemmaSearch(),
    form:     this.formSearch(),
    example:  this.exampleSearch(),
    pos:      this.partOfSpeech(),
    features: this.selectedFeatures(),
    minDate:  this.minDate(),
    maxDate:  this.maxDate(),
    latest:   this.latest(),
  }));

  // ── Text-input debounce subjects ─────────────────────────────────────────
  // Components write to these subjects; the service subscribes and updates
  // the corresponding signal after the debounce period.

  readonly lemmaInput$ = new Subject<string>();
  readonly formInput$ = new Subject<string>();
  readonly exampleInput$ = new Subject<string>();

  constructor() {
    // Debounced text — sync back into signals after 300 ms.
    this.lemmaInput$.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((v) => this.lemmaSearch.set(v));
    this.formInput$.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((v) => this.formSearch.set(v));
    this.exampleInput$.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((v) => this.exampleSearch.set(v));

    // Reactive fetch: watch a single computed that snapshots all filter
    // signals. toObservable() emits synchronously on every signal change
    // and works correctly in providedIn:'root' services (unlike effect()).
    // skip(1) skips the initial emission — the first load is done by
    // the explicit refresh() call below so we don't double-fetch on startup.
    toObservable(this.allFilters, { injector: this.injector }).pipe(skip(1)).subscribe((f) =>
      this.fetchLemmas(f),
    );

    // Feature catalog — loaded once for the chip row (the "universe"), then
    // re-resolved per selected POS. Both calls share the catalog's cache, so
    // the initial `null` request is issued once even though it is subscribed
    // to twice.
    this.featureCatalog.getFeatures(null).subscribe({
      next: (features) => this.universeFeatures.set(features),
      // The chip row has nothing to render without a catalog; keep the filter
      // usable by leaving it empty rather than surfacing an error state.
      error: () => this.universeFeatures.set([]),
    });

    toObservable(this.partOfSpeech, { injector: this.injector }).pipe(
      switchMap((pos) =>
        this.featureCatalog.getFeatures(pos).pipe(
          map((features) => ({ pos, features })),
          // A failed request leaves the chips disabled for this POS; the next
          // POS change retries, since the catalog never caches errors.
          catchError(() => of({ pos, features: [] as readonly string[] })),
        ),
      ),
    ).subscribe((state) => {
      this.posFeatures.set(state);
      // Correct a selection that predates this response — only if the user is
      // still on the POS the response belongs to.
      if (state.pos !== null && state.pos === this.partOfSpeech()) {
        this.pruneSelectedFeatures(state.features);
      }
    });

    // Initial load with no filters.
    this.refresh();
  }

  // ── Public mutation API ──────────────────────────────────────────────────

  setPartOfSpeech(pos: string | null): void {
    // Prune before the signal change so the lemma fetch triggered by the new
    // POS never carries a `featureList` that cannot apply to it. The catalog's
    // synchronous probe covers the common case (the POS list was already
    // fetched); otherwise the async prune below corrects the selection when
    // the response arrives.
    if (pos !== null) {
      this.pruneSelectedFeatures(this.featureCatalog.peek(pos));
    }
    this.partOfSpeech.set(pos);
  }

  toggleFeature(key: string): void {
    this.selectedFeatures.update((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );
  }

  clearFilters(): void {
    this.lemmaSearch.set(EMPTY_FILTERS.lemmaSearch);
    this.formSearch.set(EMPTY_FILTERS.formSearch);
    this.exampleSearch.set(EMPTY_FILTERS.exampleSearch);
    this.partOfSpeech.set(EMPTY_FILTERS.partOfSpeech);
    this.selectedFeatures.set(EMPTY_FILTERS.selectedFeatures);
    this.minDate.set(EMPTY_FILTERS.minDate);
    this.maxDate.set(EMPTY_FILTERS.maxDate);
    this.latest.set(EMPTY_FILTERS.latest);
  }

  /** Force a re-fetch with the current filters (e.g. after a save/delete). */
  refresh(): void {
    this.fetchLemmas({
      lemma:    this.lemmaSearch(),
      form:     this.formSearch(),
      example:  this.exampleSearch(),
      pos:      this.partOfSpeech(),
      features: this.selectedFeatures(),
      minDate:  this.minDate(),
      maxDate:  this.maxDate(),
      latest:   this.latest(),
    });
  }

  // ── Private ──────────────────────────────────────────────────────────────

  /**
   * Drops selected features that are not in `applicable`.
   *
   * Called from two places:
   *   - `setPartOfSpeech()`, synchronously, when `FeatureCatalogService` already
   *     has the list cached (via `peek`) — this keeps the very first lemma fetch
   *     for the new POS free of inapplicable `featureList` values;
   *   - the feature pipeline, when the async response for the current POS lands.
   *
   * Pass `undefined` for "applicability unknown" (no pruning). Returns the
   * existing array untouched when nothing was removed, so the `allFilters`
   * computed does not emit and no redundant lemma fetch is triggered.
   */
  private pruneSelectedFeatures(applicable: readonly string[] | undefined): void {
    if (applicable === undefined) {
      return;
    }

    const allowed = new Set(applicable);
    this.selectedFeatures.update((current) => {
      const next = current.filter((key) => allowed.has(key));
      return next.length === current.length ? current : next;
    });
  }

  /**
   * Builds query params and fetches the filtered lemma list directly via
   * HttpClient rather than through LexiconEndpointsService.lemmasGet().
   *
   * `featureList` itself is fine through the generated client now that the API
   * declares it as a plain string (`FeatureListParam`) — HttpParamsBuilder
   * appends it as `?featureList=a,b`. We still build the params by hand for
   * the date filters: the generated client serialises `Date` values as full
   * ISO datetimes (`2026-11-01T00:00:00.000Z`), while the API declares
   * `minDate`/`maxDate` as `format: date` and expects `YYYY-MM-DD`.
   */
  private fetchLemmas(params: {
    lemma: string;
    form: string;
    example: string;
    pos: string | null;
    features: string[];
    minDate: Date | null;
    maxDate: Date | null;
    latest: boolean;
  }): void {
    let httpParams = new HttpParams();
    if (params.pos)     httpParams = httpParams.set('partOfSpeech', params.pos);
    if (params.lemma)   httpParams = httpParams.set('lemma', params.lemma);
    if (params.form)    httpParams = httpParams.set('form', params.form);
    if (params.example) httpParams = httpParams.set('example', params.example);
    if (params.latest)  httpParams = httpParams.set('latest', 'true');
    if (params.minDate) httpParams = httpParams.set('minDate', params.minDate.toISOString().slice(0, 10));
    if (params.maxDate) httpParams = httpParams.set('maxDate', params.maxDate.toISOString().slice(0, 10));
    if (params.features.length > 0) {
      // Plain comma-separated list, e.g. `featureList=masculine,nominative`.
      // The API also accepts the bracketed form `[a,b]`.
      httpParams = httpParams.set('featureList', params.features.join(','));
    }

    this.loadingSignal.set(true);
    this.loadErrorSignal.set(false);

    this.httpClient.get<UserLemmaResponse[]>(`${this.basePath}/lemmas`, { params: httpParams }).pipe(
      catchError(() => {
        this.loadErrorSignal.set(true);
        return EMPTY;
      }),
      finalize(() => this.loadingSignal.set(false)),
    ).subscribe((lemmas) => this.savedLemmasSignal.set(lemmas));
  }
}
