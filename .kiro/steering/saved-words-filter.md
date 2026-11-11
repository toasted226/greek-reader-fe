# Saved Words Filter — Architecture & Implementation Plan

> **See also:** `.kiro/steering/lemma-filter-reuse.md` — the plan for reusing this filter UI/state for global lemma search. That work is not implemented yet, and it changes the shape of the service and component described below.

## Overview

The Saved Words page (`/saved-words`) lets authenticated users browse their saved Greek lemmas. The backend `GET /lemmas` endpoint exposes eight optional query parameters that allow server-side filtering. This document describes the full filtering architecture and the step-by-step implementation plan for future agents.

---

## API Contract

**Endpoint:** `GET /lemmas`  
**Service method:** `LexiconEndpointsService.lemmasGet(...)` in `src/api/services/lexiconEndpoints.service.ts`

| Parameter | TypeScript type | Wire format |
|---|---|---|
| `lemma` | `string` | `?lemma=value` |
| `form` | `string` | `?form=value` |
| `partOfSpeech` | `string` | `?partOfSpeech=value` |
| `featureList` | `FeatureListParam` (`string`) | `?featureList=val1,val2` — comma-separated, optionally wrapped in brackets (`[val1,val2]`) |
| `minDate` | `Date` | `?minDate=YYYY-MM-DD` — `format: date`, not ISO datetime |
| `maxDate` | `Date` | `?maxDate=YYYY-MM-DD` — `format: date`, not ISO datetime |
| `latest` | `boolean` | `?latest=true` |
| `example` | `string` | `?example=value` |

> **Note on featureList serialisation:** The OpenAPI spec declares `featureList` as a plain string (`FeatureListParam`), pattern `^(?:\[[^\[\]]*\]|[^\[\]]*)$`, with examples `masculine`, `masculine, nominative` and `[masculine, nominative]` — so both the bare and the bracketed comma-separated forms are valid. Because the value is a primitive, the generated `HttpParamsBuilder` appends it under the correct key (`?featureList=a,b`). `SavedWordsFilterService.fetchLemmas()` still builds `HttpParams` manually, but only because of the date filters: the generated client serialises `Date` as a full ISO datetime, while `minDate`/`maxDate` are declared `format: date` (`YYYY-MM-DD`).

> **Always fetch the live spec** at `http://localhost:3000/openapi/v1.json` (requires the backend to be running) before assuming parameter formats. The `generate:api` script in `package.json` regenerates the client from this spec.

---

## Morphological Feature Taxonomy

The frontend keeps a hardcoded fallback taxonomy (in `src/app/analysis/filter-features.ts`) derived from the existing inflection table components in `src/app/analysis/parts-of-speech/`. This is used:
- When no POS is selected (show all features, all enabled)
- As an instant fallback while the API request is in-flight

**When a POS is selected**, `SavedWordsFilterService` calls `GET /lexicon/features?partOfSpeech=<pos>` and replaces the hardcoded list with the live response. This means the backend owns the morphological grammar; the frontend constant is purely a safety net.

> **API endpoint (contract agreed, not yet in the spec):** `GET /lexicon/features?partOfSpeech=<pos>` → `string[]`.
> - Always returns an array.
> - `partOfSpeech` omitted → every distinct feature.
> - Unrecognised `partOfSpeech` → `[]` (not an error).
> - Feature strings are **identical** to the values `?featureList=` accepts.
>
> Results must be **cached on the frontend** in one shared service keyed by `partOfSpeech` (see `.kiro/steering/lemma-filter-reuse.md` → D4/W12).

### Parts of Speech

Values used as the `partOfSpeech` parameter. Derived from the inflection table component imports in `InflectionTable`:

`noun` | `verb` | `adjective` | `article` | `pronoun` | `proper-noun` | `numeral`

Indeclinable types (adverbs, conjunctions, prepositions, particles) have no inflection tables in the codebase but may appear as `pos` values on `LemmaResponse`.

### Features by Part of Speech

```
Gender:         masculine | feminine | neuter
                → applicable to: noun, adjective, article, pronoun, proper-noun, numeral

Case:           nominative | accusative | genitive | vocative
                → applicable to: noun, adjective, article, pronoun, proper-noun, numeral

Number:         singular | plural
                → applicable to: noun, adjective, article, pronoun, proper-noun, numeral, verb

Degree:         positive | comparative | superlative
                → applicable to: adjective

Definiteness:   definite | indefinite
                → applicable to: article

Person:         first-person | second-person | third-person
                → applicable to: verb, pronoun

Tense/Aspect:   present | past | perfect
                → applicable to: verb (also appears on participle sub-forms)

Voice:          active | passive
                → applicable to: verb (finite forms, participles, infinitives)

Non-finite:     participle | infinitive-aorist
                → applicable to: verb
```

The UI should grey out (disable, not hide) feature chips that are not in the applicable set for the currently selected `partOfSpeech`. When no POS is selected, all feature chips are enabled.

---

## Component Architecture

### New files to create

```
src/app/pages/saved-words/
  saved-words-filter.service.ts   ← holds filter state; calls lemmasGet() with params
  saved-words-filter/
    saved-words-filter.component.ts
    saved-words-filter.component.html
```

### Modified files

```
src/app/analysis/saved-lemmas.service.ts   ← delegate refresh() to SavedWordsFilterService
src/app/pages/saved-words/saved-words.component.ts   ← import filter component
src/app/pages/saved-words/saved-words.component.html ← add filter bar above list
```

### Service: `SavedWordsFilterService`

Scoped to the saved-words page (`providedIn: SavedWordsComponent` or root — TBD). Responsibilities:

- Holds the current filter state as signals:
  - `lemmaSearch: signal<string>('')`
  - `formSearch: signal<string>('')`
  - `partOfSpeech: signal<string | null>(null)`
  - `selectedFeatures: signal<string[]>([])`
  - `minDate: signal<Date | null>(null)`
  - `maxDate: signal<Date | null>(null)`
  - `latest: signal<boolean>(false)`
  - `exampleSearch: signal<string>('')`
- Exposes `hasActiveFilters: Signal<boolean>` (computed)
- Exposes `availableFeatures: Signal<FeatureEntry[]>` (computed from POS) — each entry has `key`, `label`, `disabled` (true when not applicable to selected POS)
- Exposes `setFilter(key, value)` and `clearFilters()` methods
- Calls `LexiconEndpointsService.lemmasGet(...)` with current filter values on every filter change (debounced 300 ms for text inputs)
- Owns the `savedLemmas`, `loading`, and `loadError` signals (currently on `SavedLemmasService` — either extend that service or have `SavedWordsFilterService` compose it)

### Filter bar component: `SavedWordsFilterComponent`

Standalone. Injected into `SavedWordsComponent`. Binds entirely to `SavedWordsFilterService`. Two visual rows:

**Row 1 (always visible):**
- Lemma text search input
- Form text search input  
- Part of speech `<select>`
- "Latest only" toggle

**Row 2 (collapsed behind "More filters" disclosure):**
- Min/max date range inputs
- Feature chip multi-select (greyed-out chips for inapplicable features)
- Example/context sentence text search

**Active filter summary bar** (shown below filter rows when any filter is active):
- Result count: "Showing N of M words"
- Dismissible tags for each active filter
- "Clear all" button

---

## UI Styling Conventions

Match the existing Tailwind token system used throughout the app:

- Cards / containers: `bg-surface-card border border-border-default rounded-xl`
- Page background: `bg-surface-page`
- Primary text: `text-text-primary`
- Secondary / muted text: `text-text-secondary`
- Brand accent: `text-brand-primary`, `bg-brand-soft`
- POS badge (reference): `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-soft text-brand-primary`
- Disabled chips: `opacity-40 cursor-not-allowed`
- Focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`

---

## Implementation Plan

Work through these steps one at a time. Update the checkbox when complete.

### Step 1 — Feature taxonomy constant ✅
- [x] Create `src/app/analysis/filter-features.ts`
- Exports `FeatureEntry` interface, `POS_VALUES`, `POS_LABELS`, `ALL_FEATURES`, and `featuresForPos(pos)`
- `featuresForPos()` returns all features with `enabled` flag — all true when `pos` is null, otherwise true only for features whose `applicableTo` includes that POS
- No Angular dependencies; pure data/logic
- Build verified passing

### Step 2 — `SavedWordsFilterService` ✅
- [x] Create `src/app/pages/saved-words/saved-words-filter.service.ts`
- Individual signals per filter field; `hasActiveFilters` and `availableFeatures` as `computed()`
- Text inputs debounced 300 ms via `Subject` + `debounceTime`; immediate filters (POS, latest, dates) trigger via `effect()`
- `effect()` reads all filter signals, then calls `fetchLemmas()` via `untracked()` to avoid circular tracking
- `setPartOfSpeech()` auto-removes selected features that are no longer applicable to the new POS
- `availableFeatures` currently uses `featuresForPos()` from the constant file (hardcoded fallback)
- **TODO (after `GET /lexicon/features` ships):** update `availableFeatures` to call the generated client method for that endpoint when POS is non-null; use the hardcoded fallback while in-flight. See comment block in the service and D4/W12 in `lemma-filter-reuse.md`.
- Build verified passing

### Step 3 — Filter bar template (primary row) ✅
- [x] Created `SavedWordsFilterComponent` (`saved-words-filter/saved-words-filter.component.ts` + `.html`)
- Primary row: lemma search input, inflected form search input, POS select, "Latest only" toggle
- Text inputs pipe through `filterService.lemmaInput$` / `formInput$` subjects (debounced in the service)
- POS select calls `filterService.setPartOfSpeech()` (clears inapplicable features automatically)
- "Latest only" toggle writes directly to `filterService.latest` signal
- Added `<app-saved-words-filter />` to `saved-words.component.html` above the list
- Migrated `SavedWordsComponent` from `SavedLemmasService` to `SavedWordsFilterService`
- Empty-state message is context-aware: different text when filters are active vs. no saves at all
- Select chevron SVG moved to `src/styles.css` as `.filter-select` to avoid Angular template parser issues with inline data URIs
- Build verified passing

### Step 4 — Feature chips with POS-aware greying ✅
- [x] Added "More filters" disclosure button to the primary row (chevron rotates when open)
- [x] Secondary section contains: date range inputs (Saved from / Saved to), feature chip multi-select, context sentence search
- [x] Feature chips bind to `filterService.availableFeatures()` — chips with `enabled: false` get `opacity-40 cursor-not-allowed` and `[disabled]="true"`; the `onFeatureToggle` handler is a no-op when `enabled` is false
- [x] POS-aware note shown inline next to the "Morphological features" label when a POS is selected, naming which POS is active
- [x] Date inputs use `dateToInputValue()` helper on the component to convert `Date | null` → `YYYY-MM-DD` string for the native input binding
- [x] Date changes fire immediately (no debounce); example search is debounced via `filterService.exampleInput$`
- [x] Build verified passing

### Step 5 — Active filter summary bar ✅
- [x] Added summary bar to `saved-words.component.html`, rendered between the filter component and the word list when `filterService.hasActiveFilters()` is true
- [x] `activeFilterPills` computed signal on `SavedWordsComponent` maps each active filter to an `ActiveFilterPill` with `id`, `label`, and a `remove()` closure
- [x] One pill per active filter: lemma, form, POS, each selected feature (individual pills), minDate, maxDate, latest, example
- [x] Text inputs: `remove()` resets both the signal and the debounce subject so the input element's displayed value stays in sync
- [x] "Clear all" button calls `filterService.clearFilters()`
- [x] Summary bar uses `role="status" aria-live="polite"` so screen readers announce filter changes
- [x] Result count omitted for now — the API does not return a total count with the filtered response (revisit in Step 6 if the endpoint is extended)
- [x] Build verified passing

### Step 6 — Integration & polish ✅
- [x] Confirmed `SavedLemmasService` (app-root singleton) and `SavedWordsFilterService` are fully independent — `SavedLemmasService` is used only by `LemmaItem` for toggle/isSaved; the saved-words page reads exclusively from `SavedWordsFilterService`
- [x] Fixed feature chip hover classes — replaced individual `[class.hover:*]` bindings (not scanned by Tailwind JIT) with `[ngClass]="featureChipClasses(key, enabled)"`, where `featureChipClasses()` returns a `Record<string, boolean>` with all class strings written as literals so Tailwind can scan them at build time
- [x] Fixed toggle `aria-label` redundancy — the outer `<label>` element already provides the accessible name "Latest only" via its text content; the inner `aria-label` on the `sr-only` checkbox was removed to prevent screen readers from announcing the name twice
- [x] Added `aria-label="Additional filters"` to the secondary section `<div>` to give the `aria-controls` reference a proper region label
- [x] All other interactive controls already had correct `aria-label` or were labelled via associated `<label for="…">` elements (confirmed by audit)
- [x] Pre-existing test failures in `analyse.component.spec.ts` confirmed unrelated to this work — only tests for `LemmaItem` and `InfoPanel` reference `SavedLemmasService` and both pass unchanged
- [x] Build verified — no TypeScript or Angular template errors; font inlining failure is a network-only environment constraint unrelated to code
