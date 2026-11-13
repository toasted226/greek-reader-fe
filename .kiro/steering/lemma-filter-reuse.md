# Lemma Filter — Reuse for Global Lemma Search

**Status:** design agreed, not implemented.
**Owner of the backend half:** the API author (adding filters to `GET /lexicon/query`).
**Read this together with:** `.kiro/steering/saved-words-filter.md` (the original saved-words build-out).

---

## Goal

One filter UI + one filter state model, reused for two search surfaces:

| Surface | Endpoint | Returns | Filters |
|---|---|---|---|
| Saved words (`/saved-words`) | `GET /lemmas` | `UserLemmaResponse[]` | `partOfSpeech`, `lemma`, `form`, `example`, `featureList`, `minDate`, `maxDate`, `latest` |
| Global lemmas (new) | `GET /lexicon/query` | `LemmaResponse[]` | `partOfSpeech`, `lemma`, `form`, `featureList` |

The global endpoint is being extended to accept the same filters **except** `minDate`/`maxDate` (saved-on dates), `example` (context sentence) and `latest` — all three are per-user saved-word concepts. Confirmed: `latest` will **not** exist as a filter for global lemma search.

Nothing in this document has been implemented yet.

---

## Dependency chain

```
D1  backend: /lexicon/query accepts partOfSpeech, lemma, form, featureList
 └─ D2  regenerate the client (`bun run generate:api`) → lexiconQueryGet signature
     └─ W4  GlobalLemmaQuerySource + global page

D3  decisions needed (save-from-global, empty-state copy)
 └─ W5/W6/W7/W8

D4  backend: GET /lexicon/features (contract agreed)  [not blocking]
 └─ W12  FeatureCatalogService + live availableFeatures

W1, W2, W3, W9, W10 are NOT blocked — they can start immediately.
```

Do **not** start W4 before D1 and D2 land, and do not hand-write a temporary HTTP call to fake it.

---

## Blocking dependencies

### D1 — Backend: filters on `GET /lexicon/query`

Current spec (verified against `http://localhost:3000/openapi/v1.json`):

```
GET /lexicon/query?form=<string>          → LemmaResponse[]
```

Required after the change:

```
GET /lexicon/query?partOfSpeech&lemma&form&featureList   → LemmaResponse[]
```

Notes for the API side:

- **Make every parameter optional.** Today `form` is a required first positional parameter, and the generator mirrors that (`lexiconQueryGet(form: string, …)` in `src/api/services/lexiconEndpoints.service.ts`). If `form` stays required, every global-search call has to pass `undefined` for it.
- Reuse the existing `FeatureListParam` schema (`type: string`, pattern `^(?:\[[^\[\]]*\]|[^\[\]]*)$`) so the wire format stays identical to `/lemmas`.
- **`latest` is out of scope for global search** — confirmed by the product owner. It stays a saved-words-only filter and must not be added to `/lexicon/query`.

### D2 — Regenerate the generated client

After D1: `bun run generate:api` (requires the backend on `localhost:3000`). This rewrites all of `src/api/` — expect `lexiconQueryGet` to change signature. There are currently **no callers** of `lexiconQueryGet` in `src/`, so the signature change is free; just don't add one before regenerating.

### D3 — Product decisions (no code dependency, but block the UI work)

1. **Saving from a global result** — `LemmaItem.toggleSaved()` currently sends `contextSentence`. A global result has no context sentence. Options: hide the save button, prompt for one, or allow an empty string (needs backend agreement).
2. **Empty-state copy** for the global page (the saved page says "You haven't saved any words yet.").

### D4 — `GET /lexicon/features?partOfSpeech=<pos>` (contract agreed, not in the spec yet)

Not blocking any other work — the hardcoded taxonomy in `src/app/analysis/filter-features.ts` is scope-neutral and works for both surfaces until this ships.

**Agreed contract:**

| Aspect | Behaviour |
|---|---|
| Path | `GET /lexicon/features` (note: `/lexicon`, **not** `/lemmas` — the feature list is lexicon-level, not user-scoped) |
| Param | `partOfSpeech?: string` — optional |
| Response | Always a `string[]`; never an object wrapper |
| No `partOfSpeech` | Every distinct feature |
| Unknown `partOfSpeech` | `[]` — **not** an error, not a 400 |
| String vocabulary | Identical to the values `?featureList=` accepts (and to `lemma.forms[].features`) |
| Caching | Required **on the frontend**; no backend cache headers are needed for the in-memory cache |

No backend cache headers are required: the Angular service caches per `partOfSpeech` for the SPA session, and all filter pages are `RenderMode.Client` so SSR never sees the call. If browser-level caching across reloads is ever wanted, the endpoint sits behind cookie auth — use `Cache-Control: private, max-age=…` (not `public`) and attach it only to 200 responses.

Path is `/lexicon/features` rather than `/lemmas/features` because the feature list is lexicon-level and shared by both surfaces — `/lemmas` is the user-scoped saved-words endpoint.

---

## Current state (what exists today)

| File | Role | Reusable as-is? |
|---|---|---|
| `src/app/analysis/filter-features.ts` | Feature/POS taxonomy + `featuresForPos()` | ✅ fully scope-neutral |
| `src/app/pages/saved-words/saved-words-filter.service.ts` | Filter state **and** saved-words HTTP **and** result state, `providedIn: 'root'` | ❌ three concerns in one class |
| `src/app/pages/saved-words/saved-words-filter/saved-words-filter.component.{ts,html}` | Filter bar UI, injects the concrete service | ❌ hardcoded service, hardcoded saved-only fields |
| `src/app/pages/saved-words/saved-words.component.ts` | `activeFilterPills` computed, mutates service signals + debounce subjects | ❌ lives on the page, not reusable |
| `src/app/pages/saved-words/saved-words.component.html` | loading / error / empty / `@for` over `LemmaItem` | ❌ inline in the page |
| `src/app/analysis/lemma-item/lemma-item.ts` | Result card, injects `SavedLemmasService` for save state | ⚠️ `contextSentence` is `input.required` |

---

## Target architecture

```
LemmaFilterState            (signals, computeds, debounce subjects, no HttpClient)
   │
   ├── SavedWordsFilterService    → SavedWordsQuerySource   → GET /lemmas
   └── GlobalLemmaFilterService   → GlobalLemmaQuerySource  → GET /lexicon/query

LemmaFilterComponent  ──injects──▶ LEMMA_FILTER_STATE (token, abstract)
ActiveFilterPillsComponent ──────▶ LEMMA_FILTER_STATE
LemmaResultListComponent ────────▶ results / loading / error / empty copy
```

`LemmaQuerySource` is the only place that knows an endpoint, a response type, or which filters are supported.

---

## Work items

Ordered so the unblocked work lands first. Each item lists the files it touches and how to know it is done.

### W1 — Extract `LemmaFilterState` (unblocked)

New file, e.g. `src/app/analysis/lemma-filter/lemma-filter-state.ts`.

Move from `saved-words-filter.service.ts`:

- signals: `lemmaSearch`, `formSearch`, `exampleSearch`, `partOfSpeech`, `selectedFeatures`, `minDate`, `maxDate`, `latest`
- `hasActiveFilters`, `availableFeatures`, `allFilters` computeds
- debounce subjects `lemmaInput$`, `formInput$`, `exampleInput$` + their subscriptions
- `setPartOfSpeech`, `toggleFeature`, `clearFilters`
- **new:** `clearFilter(key)` so the pill UI never touches a debounce subject directly
- **new:** `snapshot()` returning the plain `LemmaFilterQuery` object (replaces the private `allFilters` shape)

It must not import `HttpClient`, `Injector`, `BASE_PATH_DEFAULT`, or any generated model. Keep `EMPTY_FILTERS`.

Done when: the class compiles standalone and `saved-words-filter.service.ts` still behaves identically.

### W2 — Query source contract + result view model (unblocked)

New file, e.g. `src/app/analysis/lemma-filter/lemma-query-source.ts`.

```ts
export interface LemmaFilterQuery {
  lemma: string;
  form: string;
  example: string;
  partOfSpeech: string | null;
  features: string[];
  minDate: Date | null;
  maxDate: Date | null;
  latest: boolean;
}

export interface LemmaResult {
  key: string;                 // stable @for track key
  lemma: LemmaResponse;
  contextSentence?: string;    // saved words only
}

export interface LemmaQuerySource {
  readonly supports: { dates: boolean; example: boolean; latest: boolean };
  fetch(query: LemmaFilterQuery): Observable<LemmaResult[]>;
}

export const LEMMA_QUERY_SOURCE = new InjectionToken<LemmaQuerySource>('LEMMA_QUERY_SOURCE');
```

`supports` drives the component's optional fields (W5), so the UI never hardcodes "saved words".

### W3 — `SavedWordsQuerySource` (unblocked)

Move the current `fetchLemmas()` body (`saved-words-filter.service.ts`) here.

- Calls `LexiconEndpointsService.lemmasGet(...)`; no hand-built `HttpParams`. Dates are formatted `YYYY-MM-DD` because the client is generated with `dateType: 'string'` (see `openapi.config.ts`).
- Maps `UserLemmaResponse` → `LemmaResult` (`key: String(saved.id)`, `contextSentence: saved.contextSentence`).
- `supports: { dates: true, example: true, latest: true }`.

### W4 — `GlobalLemmaQuerySource` (**blocked by D1 + D2**)

- Calls the regenerated `LexiconEndpointsService.lexiconQueryGet(...)` — no hand-built `HttpParams` needed, since there are no `Date` params.
- Maps `LemmaResponse` → `LemmaResult` (`key: String(lemma.id)`, no `contextSentence`).
- `supports: { dates: false, example: false, latest: false }`.
- Ignore `query.minDate`/`query.maxDate`/`query.example`/`query.latest` defensively (log nothing, just don't send them).

### W5 — Rename + parameterise the filter component (unblocked, but see D3)

`saved-words-filter.component.*` → `lemma-filter/lemma-filter.component.*`, selector `app-lemma-filter`.

- Inject `LEMMA_FILTER_STATE` (token) instead of `inject(SavedWordsFilterService)`.
- Replace the hardcoded saved-only copy with inputs, gated on `source.supports`:

| Today (hardcoded) | Replace with |
|---|---|
| "Saved from" / "Saved to" labels | `dateFromLabel` / `dateToLabel` inputs, hidden when `!supports.dates` |
| "Search within saved context sentences…" placeholder | `contextPlaceholder` input, hidden when `!supports.example` |
| "Latest only" toggle | hidden when `!supports.latest` (global search always hides it — `latest` is not a global filter) |
| — | `resultNoun` input for any copy that names the result set |

- **Fix the duplicate DOM ids.** `filter-lemma`, `filter-form`, `filter-pos`, `filter-min-date`, `filter-max-date`, `filter-example`, `filter-more` are hardcoded; two instances on one page break `<label for>` and `aria-controls`. Generate a per-instance prefix and bind `[id]`, `[for]`, `[attr.aria-controls]`.
- Keep `featureChipClasses()` as-is — its class strings must stay literal so Tailwind's JIT scanner sees them.

### W6 — Extract the active-filter pills (unblocked)

From `saved-words.component.ts` (`activeFilterPills`):

- Pure function `buildFilterPills(state): ActiveFilterPill[]` — easy to unit test.
- `ActiveFilterPillsComponent` rendering them with `role="status" aria-live="polite"`.
- `remove()` callbacks use `state.clearFilter(key)` (W1) instead of writing signals and `lemmaInput$.next('')`.

The pill labels need `ALL_FEATURES`/`POS_LABELS` from `filter-features.ts` — already scope-neutral.

### W7 — Extract the result list (unblocked)

From `saved-words.component.html`:

- `LemmaResultListComponent` with `results`, `loading`, `loadError`, `hasActiveFilters`, `emptyMessage`, `emptyFilteredMessage` inputs, and a retry output wired to `refresh()`.
- Keeps the `@for (…; track result.key)` over `LemmaItem`.

### W8 — `LemmaItem` (unblocked)

`src/app/analysis/lemma-item/lemma-item.ts`:

- `contextSentence = input.required<string>()` → `input('')` so global results can render it.
- `toggleSaved()` then saves with an empty context sentence — resolve per **D3.2** (hide the button, prompt, or accept empty).
- `isSaved()` already works globally because `SavedLemmasService` is app-wide.

### W9 — Per-surface providers (unblocked)

Both filter services are `providedIn: 'root'` today, which means one shared instance: filter state, results, and the initial `refresh()` are global. Open a second surface and the two pages fight over the same signals.

Provide at page/route level instead:

```ts
@Component({
  providers: [
    SavedWordsFilterService,
    { provide: LEMMA_QUERY_SOURCE, useExisting: SavedWordsQuerySource },
    { provide: LEMMA_FILTER_STATE, useExisting: SavedWordsFilterService }, // or a dedicated state instance
  ],
})
```

### W10 — Tests (unblocked)

- Extract `buildLemmaFilterParams(query, supports): HttpParams` as a pure function and test the wire format (see table below). There are currently no tests for the filter service.
- Test `featuresForPos()` enabled/disabled behaviour.
- Test `buildFilterPills()`.

### W11 — Docs

- Generalise `.kiro/steering/saved-words-filter.md` into a lemma-filtering doc once W1–W7 land, and cross-link this file.
- Update this file's status header when work starts/finishes.

### W12 — `FeatureCatalogService` (**blocked by D4 only**, independent of D1/D2)

New root service, e.g. `src/app/analysis/lemma-filter/feature-catalog.service.ts`.

- `featuresFor(partOfSpeech: string | null): Signal<string[] | undefined>` — `undefined` while loading/unknown.
- Cache `Map<string | null, string[]>`; one in-flight request per key (`shareReplay(1)`), so two chips never trigger two calls.
- Fetch **lazily** on first use per POS — do not fetch in the constructor (the saved-words service already fetches there for results).
- Cache successes only. On error, leave the key uncached and let `availableFeatures` fall back to `featuresForPos(pos)`; a transient failure must not poison the session.
- Cache `[]` too — per the contract it is a deterministic answer, not an error.

Then rewire `availableFeatures` in `saved-words-filter.service.ts` (and its future `LemmaFilterState` home):

1. `partOfSpeech() === null` → `featuresForPos(null)`; optionally warm the cache with the all-features response.
2. Response present → map onto `ALL_FEATURES` for label/order, marking listed keys as enabled.
3. In-flight or errored → `featuresForPos(pos)`.

**Edge case the docs must not lose:** `[]` for an unknown POS and "all features" for an omitted POS are different answers. If `partOfSpeech` is non-null and the response is `[]`, all chips would be disabled — a silent dead end if the backend vocabulary drifts from `filter-features.ts`. Prefer falling back to `featuresForPos(pos)` when a non-null POS yields `[]`, and log nothing user-visible. Only show all-disabled chips if that is a deliberate decision (see D3).

Also handle features the API returns that are **not** in `ALL_FEATURES`: they would be silently dropped by step 2. Add a fallback entry (title-cased label, appended after the known ones) so the backend really owns the grammar.

---

## Wire-format reference (verified — do not re-derive)

`featureList` is `FeatureListParam`, a **plain string**, pattern `^(?:\[[^\[\]]*\]|[^\[\]]*)$`, examples `masculine`, `masculine, nominative`, `[masculine, nominative]`.

| Param | Send as | Notes |
|---|---|---|
| `featureList` | `featureList=masculine,nominative` | Comma-separated, brackets optional. Angular leaves commas literal and percent-encodes brackets (`%5B…%5D`) if you use them. |
| `minDate` / `maxDate` | `YYYY-MM-DD` | Spec is `format: date`. |
| `latest` | `true` / `false` | Saved words only — not a global-search filter. Only sent when true today. |
| text params | as-is | `partOfSpeech`, `lemma`, `form`, `example`. |

**Dates go through the generated client as strings.** `src/api` is generated with `dateType: 'string'` (see `openapi.config.ts`), so `lemmasGet`-style date parameters are typed `string` and accept the declared `format: date` value directly (`minDate=2026-11-01`). Do not switch the generator back to `dateType: 'Date'`: `HttpParamsBuilder.handleDate()` would emit a full ISO datetime (`minDate=2026-11-01T00:00:00.000Z`) to a `DateOnly` parameter.

Feature keys in `filter-features.ts` (`masculine`, `first-person`, …) match the `features` strings the API returns on forms, so no mapping layer is needed.

---

## Gotchas

- `UserLemmaResponse.userId` was removed by the last regeneration; `UserLemmaResponse` is now `{ id, lemma, contextSentence }`. Don't reintroduce a dependency on `userId`.
- `lemma-item.ts` derives gender/article type from `lemma.forms[].features`; global results carry the same `LemmaResponse` shape, so that still works.
- `POS_VALUES` includes indeclinable types (`adverb`, `conjunction`, `preposition`, `particle`). Global search will return these; the saved-words surface rarely has them. Don't filter the POS list per surface.
- The saved-words service fetches once in its constructor (`refresh()`). If it becomes per-page-provided (W9), that is fine — but do not leave a root-provided instance that also fetches, or you get a duplicate request on every page load.
- `toObservable(..., { injector })` is used instead of `effect()` on purpose: `effect()` does not work correctly in `providedIn: 'root'` services. If the reactive subscription moves into a shared base class, keep `toObservable` + `skip(1)`.

---

## Acceptance criteria for "reusable"

1. The same component renders on `/saved-words` and the global page, with saved-only fields hidden by `supports`.
2. No file under `analysis/lemma-filter/` imports `SavedWordsFilterService`, `UserLemmaResponse`, or `BASE_PATH_DEFAULT`.
3. Filtering on the global page sends exactly `partOfSpeech`, `lemma`, `form`, `featureList` — never `minDate`, `maxDate`, or `example`.
4. Both surfaces can be open in the same session without sharing filter state or results.
5. Two instances of the component on one page do not produce duplicate DOM ids.
6. `bun run build` passes; `bun run test` shows no new failures (the `analyse.component.spec.ts` failures are pre-existing).
