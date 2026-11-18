import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LexiconEndpointsService } from '../../../api';
import { FeatureCatalogService } from '../feature-catalog.service';
import { LemmaFilterQuery, LemmaFilterState } from './lemma-filter-state';

/** Minimal concrete state that records fetches without making HTTP calls. */
@Injectable()
class TestFilterState extends LemmaFilterState {
  readonly fetches: LemmaFilterQuery[] = [];

  constructor() {
    super();
    // Concrete surfaces fetch from their own constructor, after their fields
    // exist. Mirror that so the recorded fetch sequence matches production.
    this.fetches.push(this.allFilters());
  }

  protected performFetch(query: LemmaFilterQuery): void {
    this.fetches.push(query);
  }
}

describe('LemmaFilterState — clearing filters', () => {
  let state: TestFilterState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestFilterState,
        FeatureCatalogService,
        {
          provide: LexiconEndpointsService,
          useValue: { lexiconFeaturesGet: () => of({ features: ['present', 'past'] }) },
        },
      ],
    });
    state = TestBed.inject(TestFilterState);
    TestBed.tick();
  });

  const setEveryFilter = (): void => {
    state.lemmaSearch.set('λόγος');
    state.formSearch.set('λόγου');
    state.exampleSearch.set('sky');
    state.setPartOfSpeech('verb');
    state.toggleFeature('present');
    state.minDate.set(new Date('2026-11-01T00:00:00Z'));
    state.maxDate.set(new Date('2026-11-30T00:00:00Z'));
    state.latest.set(true);
    TestBed.tick();
  };

  it('clears only the requested filter and refetches once with the rest intact', () => {
    setEveryFilter();
    const before = state.fetches.length;

    state.clearFilter('form');
    TestBed.tick();

    expect(state.formSearch()).toBe('');
    expect(state.lemmaSearch()).toBe('λόγος');
    expect(state.exampleSearch()).toBe('sky');
    expect(state.partOfSpeech()).toBe('verb');
    expect(state.selectedFeatures()).toEqual(['present']);
    expect(state.minDate()).toEqual(new Date('2026-11-01T00:00:00Z'));
    expect(state.maxDate()).toEqual(new Date('2026-11-30T00:00:00Z'));
    expect(state.latest()).toBe(true);
    expect(state.fetches.length - before).toBe(1);
    expect(state.fetches.at(-1)?.form).toBe('');
  });

  it('clears each text filter through the same API, including the example filter', () => {
    setEveryFilter();

    state.clearFilter('lemma');
    state.clearFilter('example');
    TestBed.tick();

    expect(state.lemmaSearch()).toBe('');
    expect(state.exampleSearch()).toBe('');
    expect(state.formSearch()).toBe('λόγου');
  });

  it('cancels a pending debounced keystroke when its pill is removed', () => {
    vi.useFakeTimers();
    try {
      state.lemmaInput$.next('λόγος');
      state.clearFilter('lemma');
      vi.advanceTimersByTime(400);
      TestBed.tick();

      expect(state.lemmaSearch()).toBe('');
      expect(state.fetches.at(-1)?.lemma).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears every filter in one batched fetch and cancels all pending debounces', () => {
    vi.useFakeTimers();
    try {
      setEveryFilter();
      // Queue fresh keystrokes that have not debounced yet.
      state.lemmaInput$.next('νέο');
      state.formInput$.next('νέου');
      state.exampleInput$.next('θάλασσα');
      const before = state.fetches.length;

      state.clearFilters();
      TestBed.tick();

      expect(state.hasActiveFilters()).toBe(false);
      expect(state.fetches.length - before).toBe(1);

      vi.advanceTimersByTime(400);
      TestBed.tick();

      expect(state.lemmaSearch()).toBe('');
      expect(state.formSearch()).toBe('');
      expect(state.exampleSearch()).toBe('');
      expect(state.fetches.length - before).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
