/**
 * Presentation metadata for the lemma filter's feature chips.
 *
 * The **authority** for which morphological features exist — and which of them
 * apply to a given part of speech — is the API (`GET /lexicon/features`),
 * cached by `FeatureCatalogService`. Nothing in this file decides applicability;
 * the hardcoded taxonomy that used to live here has been removed.
 *
 * What remains is purely presentational:
 *   - the part-of-speech values and labels for the filter's `<select>`
 *     (the features endpoint does not expose the POS enum), and
 *   - human-readable labels plus a display order for the feature keys we know
 *     about. Unknown keys coming from the API still render — `featureLabel()`
 *     derives a label from the key and `buildFeatureEntries()` appends them
 *     after the known ones, so a new backend feature needs no frontend release.
 *
 * Feature strings are identical to the values `?featureList=` accepts and to
 * the values used by the inflection table components in
 * `src/app/analysis/parts-of-speech/`.
 */

/** A single chip in the feature filter. */
export interface FeatureEntry {
  /** The raw value sent to the API as one item of the `featureList` string. */
  key: string;
  /** Human-readable label for display in the UI. */
  label: string;
  /**
   * Whether the feature applies to the currently selected part of speech.
   * `true` whenever no POS filter is active.
   */
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Parts of speech
// ---------------------------------------------------------------------------

/**
 * Full list of part-of-speech values recognised by the API's `partOfSpeech`
 * query parameter. Derived from the inflection table component imports in
 * `InflectionTable` plus known indeclinable types.
 */
export const POS_VALUES: readonly string[] = [
  'noun',
  'verb',
  'adjective',
  'article',
  'pronoun',
  'proper-noun',
  'numeral',
  'adverb',
  'conjunction',
  'preposition',
  'particle',
] as const;

/** Display labels for POS values, used in the POS <select>. */
export const POS_LABELS: Readonly<Record<string, string>> = {
  'noun': 'Noun',
  'verb': 'Verb',
  'adjective': 'Adjective',
  'article': 'Article',
  'pronoun': 'Pronoun',
  'proper-noun': 'Proper noun',
  'numeral': 'Numeral',
  'adverb': 'Adverb',
  'conjunction': 'Conjunction',
  'preposition': 'Preposition',
  'particle': 'Particle',
};

// ---------------------------------------------------------------------------
// Feature display metadata
// ---------------------------------------------------------------------------

export interface FeatureMetadata {
  /** Raw feature value as returned by the API and accepted by `?featureList=`. */
  key: string;
  /** Human-readable label for display in the UI. */
  label: string;
}

/**
 * Known feature keys with their display labels. **Order here determines chip
 * order in the UI**; keys not listed are appended alphabetically after these.
 *
 * This is a label dictionary, not a taxonomy: it does not claim that a feature
 * applies to any particular part of speech.
 *
 * The vocabulary is mirrored from the live `GET /lexicon/features` response.
 * When the backend introduces a feature, it still renders (title-cased from the
 * key) — adding it here only gives it a curated label and a sensible position.
 */
export const FEATURE_METADATA: readonly FeatureMetadata[] = [
  // Gender
  { key: 'masculine', label: 'Masculine' },
  { key: 'feminine', label: 'Feminine' },
  { key: 'neuter', label: 'Neuter' },

  // Case
  { key: 'nominative', label: 'Nominative' },
  { key: 'accusative', label: 'Accusative' },
  { key: 'genitive', label: 'Genitive' },
  { key: 'vocative', label: 'Vocative' },

  // Number (shared: declinable types + verb)
  { key: 'singular', label: 'Singular' },
  { key: 'plural', label: 'Plural' },

  // Degree (adjective only)
  { key: 'positive', label: 'Positive' },
  { key: 'comparative', label: 'Comparative' },
  { key: 'superlative', label: 'Superlative' },

  // Definiteness (article only)
  { key: 'definite', label: 'Definite' },
  { key: 'indefinite', label: 'Indefinite' },

  // Person (verb + pronoun)
  { key: 'first-person', label: '1st person' },
  { key: 'second-person', label: '2nd person' },
  { key: 'third-person', label: '3rd person' },

  // Mood (verb)
  { key: 'indicative', label: 'Indicative' },
  { key: 'imperative', label: 'Imperative' },
  { key: 'dependent', label: 'Dependent' },

  // Tense (verb)
  { key: 'present', label: 'Present' },
  { key: 'imperfect', label: 'Imperfect' },
  { key: 'past', label: 'Past' },
  { key: 'future', label: 'Future' },
  { key: 'aorist', label: 'Aorist' },
  { key: 'perfect', label: 'Perfect' },

  // Aspect (verb)
  { key: 'imperfective', label: 'Imperfective' },
  { key: 'perfective', label: 'Perfective' },

  // Voice (verb)
  { key: 'active', label: 'Active' },
  { key: 'passive', label: 'Passive' },

  // Non-finite (verb)
  { key: 'infinitive', label: 'Infinitive' },
  { key: 'participle', label: 'Participle' },

  // Pronoun form strength
  { key: 'strong', label: 'Strong' },
  { key: 'weak', label: 'Weak' },

  // Form markers (adjective / pronoun)
  { key: 'lemma', label: 'Lemma form' },
];

const FEATURE_LABELS: ReadonlyMap<string, string> = new Map(
  FEATURE_METADATA.map(({ key, label }) => [key, label]),
);

const FEATURE_ORDER: ReadonlyMap<string, number> = new Map(
  FEATURE_METADATA.map(({ key }, index) => [key, index]),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Display label for a feature key.
 *
 * Known keys use the curated label from `FEATURE_METADATA`; anything else is
 * title-cased from the raw key (`infinitive-perfect` → `Infinitive Perfect`),
 * so features added to the backend render sensibly without a frontend change.
 */
export function featureLabel(key: string): string {
  return FEATURE_LABELS.get(key) ?? titleCase(key);
}

/**
 * Builds the chip list for the current filter state.
 *
 * @param universe Every feature key the API knows about — normally the result
 *   of `FeatureCatalogService.getFeatures(null)`. Determines *which* chips are
 *   rendered, so the row does not change shape when a POS is selected.
 * @param posFeatures The subset applicable to the selected part of speech, or
 *   `null` when no POS filter is active (everything enabled).
 *
 * Features outside `posFeatures` stay in the list with `enabled: false` — the
 * UI greys them out rather than hiding them. Keys present in `posFeatures` but
 * missing from `universe` are still included (defensive: never drop a feature
 * the API says is selectable).
 *
 * Ordering: `FEATURE_METADATA` order first, then unknown keys alphabetically.
 */
export function buildFeatureEntries(
  universe: readonly string[],
  posFeatures: readonly string[] | null,
): FeatureEntry[] {
  const enabled = posFeatures === null ? null : new Set(posFeatures);
  const keys = new Set<string>(universe);
  if (posFeatures) {
    for (const key of posFeatures) {
      keys.add(key);
    }
  }

  return [...keys].sort(compareFeatureKeys).map((key) => ({
    key,
    label: featureLabel(key),
    enabled: enabled === null || enabled.has(key),
  }));
}

function compareFeatureKeys(a: string, b: string): number {
  const orderA = FEATURE_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER;
  const orderB = FEATURE_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER;
  return orderA === orderB ? a.localeCompare(b) : orderA - orderB;
}

function titleCase(key: string): string {
  return key
    .split(/[-_\s]+/)
    .filter((word) => word !== '')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
