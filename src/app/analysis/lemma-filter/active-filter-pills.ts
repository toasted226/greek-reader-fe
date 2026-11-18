import { POS_LABELS, featureLabel } from '../filter-features';
import { LemmaFilterState } from './lemma-filter-state';

/** One dismissible label in the active-filter summary bar. */
export interface ActiveFilterPill {
  /** Stable key for `@for` tracking. */
  id: string;
  /** Human-readable text shown inside the pill. */
  label: string;
  /** Clears this one filter. */
  remove: () => void;
}

/** Saved-words-only pills can be hidden on surfaces that have no such filters. */
export interface ActiveFilterPillOptions {
  showDates?: boolean;
  showLatest?: boolean;
}

/**
 * Builds the pill list for the current state. Pure with respect to the state's
 * signal values: it only reads them and returns labelled remove callbacks.
 *
 * The example filter is included on every surface — the Dictionary exposes an
 * example search too. Only saved-on dates and "Latest" are optional.
 */
export function buildFilterPills(
  state: LemmaFilterState,
  { showDates = true, showLatest = true }: ActiveFilterPillOptions = {},
): ActiveFilterPill[] {
  const pills: ActiveFilterPill[] = [];

  if (state.lemmaSearch()) {
    const value = state.lemmaSearch();
    pills.push({
      id: 'lemma',
      label: `Lemma: "${value}"`,
      remove: () => state.clearFilter('lemma'),
    });
  }

  if (state.formSearch()) {
    const value = state.formSearch();
    pills.push({
      id: 'form',
      label: `Form: "${value}"`,
      remove: () => state.clearFilter('form'),
    });
  }

  const pos = state.partOfSpeech();
  if (pos) {
    pills.push({
      id: 'pos',
      label: POS_LABELS[pos] ?? pos,
      remove: () => state.clearFilter('pos'),
    });
  }

  for (const key of state.selectedFeatures()) {
    pills.push({
      id: `feature-${key}`,
      label: featureLabel(key),
      // A pill represents a single selected feature; `clearFilter('features')`
      // would remove them all, so toggle just this one.
      remove: () => state.toggleFeature(key),
    });
  }

  if (showDates && state.minDate()) {
    const value = state.minDate()!;
    pills.push({
      id: 'minDate',
      label: `From: ${value.toLocaleDateString()}`,
      remove: () => state.clearFilter('minDate'),
    });
  }

  if (showDates && state.maxDate()) {
    const value = state.maxDate()!;
    pills.push({
      id: 'maxDate',
      label: `To: ${value.toLocaleDateString()}`,
      remove: () => state.clearFilter('maxDate'),
    });
  }

  if (showLatest && state.latest()) {
    pills.push({
      id: 'latest',
      label: 'Latest only',
      remove: () => state.clearFilter('latest'),
    });
  }

  if (state.exampleSearch()) {
    const value = state.exampleSearch();
    pills.push({
      id: 'example',
      label: `Context: "${value}"`,
      remove: () => state.clearFilter('example'),
    });
  }

  return pills;
}
