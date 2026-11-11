import {
  FEATURE_METADATA,
  POS_LABELS,
  POS_VALUES,
  buildFeatureEntries,
  featureLabel,
} from './filter-features';

describe('filter-features', () => {
  describe('POS_VALUES / POS_LABELS', () => {
    it('provides a display label for every part of speech', () => {
      for (const pos of POS_VALUES) {
        expect(POS_LABELS[pos], `missing label for "${pos}"`).toBeTruthy();
      }
    });

    it('has no labels for parts of speech the API does not accept', () => {
      for (const pos of Object.keys(POS_LABELS)) {
        expect(POS_VALUES).toContain(pos);
      }
    });
  });

  describe('featureLabel', () => {
    it('uses the curated label for known keys', () => {
      expect(featureLabel('masculine')).toBe('Masculine');
      expect(featureLabel('first-person')).toBe('1st person');
      expect(featureLabel('dependent')).toBe('Dependent');
      expect(featureLabel('lemma')).toBe('Lemma form');
    });

    it('title-cases unknown keys so backend additions render sensibly', () => {
      expect(featureLabel('infinitive-perfect')).toBe('Infinitive Perfect');
      expect(featureLabel('mood')).toBe('Mood');
      expect(featureLabel('some_new  thing')).toBe('Some New Thing');
    });

    it('no longer treats the retired "infinitive-aorist" key as known', () => {
      expect(featureLabel('infinitive-aorist')).toBe('Infinitive Aorist');
    });
  });

  describe('FEATURE_METADATA', () => {
    it('has no duplicate keys', () => {
      const keys = FEATURE_METADATA.map((feature) => feature.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('covers the full vocabulary returned by GET /lexicon/features', () => {
      // Mirrors the live catalog. Unknown backend keys still render, so this is
      // a curation check, not a correctness requirement.
      expect(FEATURE_METADATA.map((feature) => feature.key).sort()).toEqual([
        'accusative', 'active', 'aorist', 'comparative', 'definite', 'dependent',
        'feminine', 'first-person', 'future', 'genitive', 'imperative', 'imperfect',
        'imperfective', 'indefinite', 'indicative', 'infinitive', 'lemma', 'masculine',
        'neuter', 'nominative', 'participle', 'passive', 'past', 'perfect',
        'perfective', 'plural', 'positive', 'present', 'second-person', 'singular',
        'strong', 'superlative', 'third-person', 'vocative', 'weak',
      ]);
    });
  });

  describe('buildFeatureEntries', () => {
    it('returns nothing for an empty catalog', () => {
      expect(buildFeatureEntries([], null)).toEqual([]);
    });

    it('enables every feature when no part of speech is selected', () => {
      const entries = buildFeatureEntries(['masculine', 'nominative'], null);

      expect(entries).toEqual([
        { key: 'masculine', label: 'Masculine', enabled: true },
        { key: 'nominative', label: 'Nominative', enabled: true },
      ]);
    });

    it('keeps inapplicable features in the list but disables them', () => {
      const entries = buildFeatureEntries(
        ['masculine', 'nominative', 'present', 'past'],
        ['present', 'past'],
      );

      expect(entries.map((entry) => [entry.key, entry.enabled])).toEqual([
        ['masculine', false],
        ['nominative', false],
        ['present', true],
        ['past', true],
      ]);
    });

    it('orders known keys by FEATURE_METADATA and unknown keys alphabetically after them', () => {
      const entries = buildFeatureEntries(
        ['zeta-feature', 'present', 'alpha-feature', 'masculine'],
        null,
      );

      expect(entries.map((entry) => entry.key)).toEqual([
        'masculine',
        'present',
        'alpha-feature',
        'zeta-feature',
      ]);
    });

    it('includes applicable features that are missing from the universe', () => {
      const entries = buildFeatureEntries(['masculine'], ['masculine', 'present']);

      expect(entries).toEqual([
        { key: 'masculine', label: 'Masculine', enabled: true },
        { key: 'present', label: 'Present', enabled: true },
      ]);
    });

    it('de-duplicates the universe', () => {
      const entries = buildFeatureEntries(['masculine', 'masculine', 'nominative'], null);

      expect(entries.map((entry) => entry.key)).toEqual(['masculine', 'nominative']);
    });

    it('labels every entry from FEATURE_METADATA or a derived label', () => {
      const universe = FEATURE_METADATA.map((feature) => feature.key);
      const entries = buildFeatureEntries(universe, null);

      expect(entries).toHaveLength(FEATURE_METADATA.length);
      expect(entries.map((entry) => entry.label)).toEqual(
        FEATURE_METADATA.map((feature) => feature.label),
      );
    });
  });
});
