import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { SavedWordsFilterService } from './saved-words-filter.service';
import { FeatureCatalogService } from '../../analysis/feature-catalog.service';
import { LexiconEndpointsService } from '../../../api/services/lexiconEndpoints.service';
import { FeaturesResponse } from '../../../api/models';

describe('SavedWordsFilterService — feature catalog', () => {
  let service: SavedWordsFilterService;
  let lexiconServiceMock: { lexiconFeaturesGet: ReturnType<typeof vi.fn> };
  let httpMock: { get: ReturnType<typeof vi.fn> };

  const UNIVERSE = ['masculine', 'nominative', 'present', 'past'];
  const VERB_FEATURES = ['present', 'past'];

  const response = (...features: string[]): FeaturesResponse => ({ features });

  /** Responds per key: the full catalog for "no POS", verb features otherwise. */
  const respondByKey = () =>
    lexiconServiceMock.lexiconFeaturesGet.mockImplementation((pos?: string) =>
      of(response(...(pos === 'verb' ? VERB_FEATURES : UNIVERSE))),
    );

  const enabledKeys = (): string[] =>
    service.availableFeatures().filter((feature) => feature.enabled).map((feature) => feature.key);

  const renderedKeys = (): string[] =>
    service.availableFeatures().map((feature) => feature.key);

  beforeEach(() => {
    lexiconServiceMock = { lexiconFeaturesGet: vi.fn() };
    httpMock = { get: vi.fn(() => of([])) };

    TestBed.configureTestingModule({
      providers: [
        SavedWordsFilterService,
        FeatureCatalogService,
        { provide: LexiconEndpointsService, useValue: lexiconServiceMock },
        { provide: HttpClient, useValue: httpMock },
      ],
    });
  });

  it('loads the full catalog once and enables every chip with no POS selected', () => {
    respondByKey();

    service = TestBed.inject(SavedWordsFilterService);
    TestBed.tick();

    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(1);
    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledWith(undefined);
    expect(renderedKeys()).toEqual(['masculine', 'nominative', 'present', 'past']);
    expect(enabledKeys()).toEqual(['masculine', 'nominative', 'present', 'past']);
    expect(service.featuresLoading()).toBe(false);
  });

  it('greys out features that do not apply to the selected POS', () => {
    respondByKey();

    service = TestBed.inject(SavedWordsFilterService);
    TestBed.tick();

    service.setPartOfSpeech('verb');
    TestBed.tick();

    // The row keeps its shape — nothing is removed, inapplicable chips are disabled.
    expect(renderedKeys()).toEqual(['masculine', 'nominative', 'present', 'past']);
    expect(enabledKeys()).toEqual(['present', 'past']);
    expect(service.availableFeatures().find((f) => f.key === 'masculine')?.enabled).toBe(false);
    expect(service.featuresLoading()).toBe(false);
  });

  it('serves the catalog from cache when switching POS back and forth', () => {
    respondByKey();

    service = TestBed.inject(SavedWordsFilterService);
    TestBed.tick();

    service.setPartOfSpeech('verb');
    TestBed.tick();
    service.setPartOfSpeech(null);
    TestBed.tick();
    service.setPartOfSpeech('verb');
    TestBed.tick();

    // One request for the full catalog, one for "verb" — never a third.
    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(2);
    expect(enabledKeys()).toEqual(['present', 'past']);
  });

  it('disables every chip and reports loading while the POS list is in flight', () => {
    const pending = new Map<string, Subject<FeaturesResponse>>();
    lexiconServiceMock.lexiconFeaturesGet.mockImplementation((pos?: string) => {
      const key = pos ?? '*';
      if (!pending.has(key)) {
        pending.set(key, new Subject<FeaturesResponse>());
      }
      return pending.get(key)!.asObservable();
    });

    service = TestBed.inject(SavedWordsFilterService);
    TestBed.tick();

    // Universe resolved; no POS selected → everything enabled.
    pending.get('*')!.next(response(...UNIVERSE));
    pending.get('*')!.complete();
    TestBed.tick();
    expect(enabledKeys()).toEqual(UNIVERSE);

    service.setPartOfSpeech('verb');
    TestBed.tick();

    expect(service.featuresLoading()).toBe(true);
    expect(enabledKeys()).toEqual([]);

    pending.get('verb')!.next(response(...VERB_FEATURES));
    pending.get('verb')!.complete();
    TestBed.tick();

    expect(service.featuresLoading()).toBe(false);
    expect(enabledKeys()).toEqual(['present', 'past']);
  });

  it('leaves the chips disabled when the feature request fails, and retries later', () => {
    lexiconServiceMock.lexiconFeaturesGet
      .mockReturnValueOnce(of(response(...UNIVERSE)))
      .mockReturnValueOnce(throwError(() => new Error('network')))
      .mockReturnValueOnce(of(response(...VERB_FEATURES)));

    service = TestBed.inject(SavedWordsFilterService);
    TestBed.tick();

    service.setPartOfSpeech('verb');
    TestBed.tick();

    expect(service.featuresLoading()).toBe(false);
    expect(enabledKeys()).toEqual([]);
    // The row is still rendered from the universe.
    expect(renderedKeys()).toEqual(UNIVERSE);

    // Re-selecting the same POS retries, because errors are never cached.
    service.setPartOfSpeech(null);
    TestBed.tick();
    service.setPartOfSpeech('verb');
    TestBed.tick();

    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(3);
    expect(enabledKeys()).toEqual(['present', 'past']);
  });

  it('keeps the chip row but disables everything for an unrecognised POS', () => {
    lexiconServiceMock.lexiconFeaturesGet.mockImplementation((pos?: string) =>
      of(pos === 'not-a-pos' ? response() : response(...UNIVERSE)),
    );

    service = TestBed.inject(SavedWordsFilterService);
    TestBed.tick();

    service.setPartOfSpeech('not-a-pos');
    TestBed.tick();

    expect(renderedKeys()).toEqual(UNIVERSE);
    expect(enabledKeys()).toEqual([]);
  });

  it('renders labels from the metadata dictionary', () => {
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(
      of(response('first-person', 'infinitive-perfect')),
    );

    service = TestBed.inject(SavedWordsFilterService);
    TestBed.tick();

    expect(service.availableFeatures().map((feature) => feature.label)).toEqual([
      '1st person',
      'Infinitive Perfect',
    ]);
  });

  describe('pruning selected features', () => {
    it('drops inapplicable features once the POS list arrives', () => {
      respondByKey();

      service = TestBed.inject(SavedWordsFilterService);
      TestBed.tick();

      service.toggleFeature('masculine');
      service.toggleFeature('present');
      expect(service.selectedFeatures()).toEqual(['masculine', 'present']);

      service.setPartOfSpeech('verb');
      TestBed.tick();

      expect(service.selectedFeatures()).toEqual(['present']);
    });

    it('prunes synchronously from the cache, so the lemma fetch never sends inapplicable features', () => {
      respondByKey();

      service = TestBed.inject(SavedWordsFilterService);
      TestBed.tick();

      // Warm the cache for "verb", then go back to "all parts of speech".
      service.setPartOfSpeech('verb');
      TestBed.tick();
      service.setPartOfSpeech(null);
      TestBed.tick();

      service.toggleFeature('masculine');
      service.toggleFeature('present');
      TestBed.tick();

      service.setPartOfSpeech('verb');

      // Pruned before any tick: the selection is already correct when the
      // POS signal change schedules the fetch.
      expect(service.selectedFeatures()).toEqual(['present']);

      TestBed.tick();

      const lastParams = httpMock.get.mock.calls.at(-1)?.[1]?.params as HttpParams;
      expect(lastParams.get('partOfSpeech')).toBe('verb');
      expect(lastParams.get('featureList')).toBe('present');
    });

    it('keeps the selection when switching back to all parts of speech', () => {
      respondByKey();

      service = TestBed.inject(SavedWordsFilterService);
      TestBed.tick();

      service.setPartOfSpeech('verb');
      TestBed.tick();
      service.toggleFeature('present');

      service.setPartOfSpeech(null);
      TestBed.tick();

      expect(service.selectedFeatures()).toEqual(['present']);
    });

    it('drops every selected feature for an unrecognised POS', () => {
      lexiconServiceMock.lexiconFeaturesGet.mockImplementation((pos?: string) =>
        of(pos === 'not-a-pos' ? response() : response(...UNIVERSE)),
      );

      service = TestBed.inject(SavedWordsFilterService);
      TestBed.tick();

      service.toggleFeature('masculine');

      service.setPartOfSpeech('not-a-pos');
      TestBed.tick();

      expect(service.selectedFeatures()).toEqual([]);
    });

    it('does not trigger an extra lemma fetch when the async prune changes nothing', () => {
      const pending = new Subject<FeaturesResponse>();
      lexiconServiceMock.lexiconFeaturesGet.mockImplementation((pos?: string) =>
        pos === 'verb' ? pending.asObservable() : of(response(...UNIVERSE)),
      );

      service = TestBed.inject(SavedWordsFilterService);
      TestBed.tick();

      service.toggleFeature('present');
      TestBed.tick();

      service.setPartOfSpeech('verb');
      TestBed.tick();

      const callsBefore = httpMock.get.mock.calls.length;

      pending.next(response('present', 'past'));
      pending.complete();
      TestBed.tick();

      expect(service.selectedFeatures()).toEqual(['present']);
      expect(httpMock.get.mock.calls.length).toBe(callsBefore);
    });
  });
});
