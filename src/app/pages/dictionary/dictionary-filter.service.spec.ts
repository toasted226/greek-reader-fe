import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { DictionaryFilterService } from './dictionary-filter.service';
import { FeatureCatalogService } from '../../analysis/feature-catalog.service';
import { LexiconEndpointsService } from '../../../api/services/lexiconEndpoints.service';
import { FeaturesResponse, LemmaPageResponse } from '../../../api/models';

describe('DictionaryFilterService', () => {
  let service: DictionaryFilterService;
  let lexiconServiceMock: {
    lexiconFeaturesGet: ReturnType<typeof vi.fn>;
    lexiconQueryGet: ReturnType<typeof vi.fn>;
  };

  const UNIVERSE = ['masculine', 'nominative', 'present', 'past'];
  const VERB_FEATURES = ['present', 'past'];

  const featuresResponse = (...features: string[]): FeaturesResponse => ({ features });

  /** Responds per key: the full catalog for "no POS", verb features otherwise. */
  const respondByKey = () =>
    lexiconServiceMock.lexiconFeaturesGet.mockImplementation((pos?: string) =>
      of(featuresResponse(...(pos === 'verb' ? VERB_FEATURES : UNIVERSE))),
    );

  const lemma = (id: number) => ({
    id,
    lemma: `lemma-${id}`,
    pos: 'Noun',
    glosses: [],
    examples: [],
    forms: [],
  });

  /** A page response of `count` items starting at `offset`, with the given total. */
  const page = (offset: number, count: number, total: number): LemmaPageResponse => ({
    items: Array.from({ length: count }, (_, i) => lemma(offset + i + 1)),
    offset,
    limit: 20,
    total,
  });

  beforeEach(() => {
    lexiconServiceMock = {
      lexiconFeaturesGet: vi.fn(),
      lexiconQueryGet: vi.fn(() => of(page(0, 20, 100))),
    };

    TestBed.configureTestingModule({
      providers: [
        DictionaryFilterService,
        FeatureCatalogService,
        { provide: LexiconEndpointsService, useValue: lexiconServiceMock },
      ],
    });
  });

  describe('query request mapping', () => {
    it('loads the first page with a limit of 20 and no filters initially', () => {
      respondByKey();

      service = TestBed.inject(DictionaryFilterService);
      TestBed.tick();

      expect(lexiconServiceMock.lexiconQueryGet).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        0,
        20,
      );
      expect(service.items().length).toBe(20);
      expect(service.total()).toBe(100);
      expect(service.firstItemNumber()).toBe(1);
      expect(service.lastItemNumber()).toBe(20);
      expect(service.loading()).toBe(false);
    });

    it('sends the form filter as formContains and resets to the first page', () => {
      respondByKey();

      service = TestBed.inject(DictionaryFilterService);
      TestBed.tick();

      // Simulate having paged ahead, then change a filter.
      service.next();
      expect(lexiconServiceMock.lexiconQueryGet).toHaveBeenLastCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        20,
        20,
      );

      service.setPartOfSpeech('verb');
      service.formSearch.set('λόγ');
      service.exampleSearch.set('sky');
      service.toggleFeature('present');
      TestBed.tick();

      expect(lexiconServiceMock.lexiconQueryGet).toHaveBeenLastCalledWith(
        'verb',
        undefined,
        undefined, // exact form never sent
        'λόγ', // formContains
        'sky',
        'present',
        0, // filter change resets to the first page
        20,
      );
      expect(service.offset()).toBe(0);
    });

    it('omits empty filters and the feature list when nothing is selected', () => {
      respondByKey();

      service = TestBed.inject(DictionaryFilterService);
      service.setPartOfSpeech(null);
      TestBed.tick();

      expect(lexiconServiceMock.lexiconQueryGet).toHaveBeenLastCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        0,
        20,
      );
    });
  });

  describe('pagination', () => {
    it('pages forward and back, and disables the controls at the ends', () => {
      respondByKey();
      lexiconServiceMock.lexiconQueryGet.mockImplementation((...args: unknown[]) => {
        const offset = Number(args[6]);
        return of(page(offset, Math.min(20, 45 - offset), 45));
      });

      service = TestBed.inject(DictionaryFilterService);
      TestBed.tick();

      expect(service.canGoPrevious()).toBe(false);
      expect(service.canGoNext()).toBe(true);

      service.next();
      TestBed.tick();
      expect(lexiconServiceMock.lexiconQueryGet).toHaveBeenLastCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        20,
        20,
      );
      expect(service.offset()).toBe(20);
      expect(service.firstItemNumber()).toBe(21);
      expect(service.canGoPrevious()).toBe(true);
      expect(service.canGoNext()).toBe(true);

      service.next();
      TestBed.tick();
      expect(service.offset()).toBe(40);
      expect(service.items().length).toBe(5);
      expect(service.firstItemNumber()).toBe(41);
      expect(service.lastItemNumber()).toBe(45);
      expect(service.canGoNext()).toBe(false);

      // Paging past the end is a no-op.
      const callsBefore = lexiconServiceMock.lexiconQueryGet.mock.calls.length;
      service.next();
      expect(service.offset()).toBe(40);
      expect(lexiconServiceMock.lexiconQueryGet.mock.calls.length).toBe(callsBefore);

      service.previous();
      TestBed.tick();
      expect(service.offset()).toBe(20);
    });
  });

  describe('refresh', () => {
    it('retries the current page on refresh, preserving the offset', () => {
      respondByKey();
      lexiconServiceMock.lexiconQueryGet.mockImplementation((...args: unknown[]) => {
        const offset = Number(args[6]);
        return of(page(offset, Math.min(20, 45 - offset), 45));
      });

      service = TestBed.inject(DictionaryFilterService);
      TestBed.tick();
      service.next();
      TestBed.tick();
      expect(service.offset()).toBe(20);

      // A failing retry (e.g. the "Try again" button) keeps the page.
      lexiconServiceMock.lexiconQueryGet.mockReturnValueOnce(
        throwError(() => new Error('network')),
      );
      service.refresh();

      expect(service.loadError()).toBe(true);
      expect(service.offset()).toBe(20);
      expect(lexiconServiceMock.lexiconQueryGet).toHaveBeenLastCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        20,
        20,
      );

      lexiconServiceMock.lexiconQueryGet.mockReturnValueOnce(of(page(20, 20, 45)));
      service.refresh();
      TestBed.tick();

      expect(service.loadError()).toBe(false);
      expect(service.items().length).toBe(20);
      expect(service.offset()).toBe(20);
    });

    it('does not fetch beyond the last page when total is smaller than one page', () => {
      respondByKey();
      lexiconServiceMock.lexiconQueryGet.mockReturnValue(of(page(0, 8, 8)));

      service = TestBed.inject(DictionaryFilterService);
      TestBed.tick();

      expect(service.items().length).toBe(8);
      expect(service.canGoNext()).toBe(false);
      expect(service.canGoPrevious()).toBe(false);
    });
  });

  describe('feature chips', () => {
    it('renders the universe from the features endpoint and greys out inapplicable chips', () => {
      respondByKey();

      service = TestBed.inject(DictionaryFilterService);
      TestBed.tick();

      expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledWith(undefined);
      expect(service.availableFeatures().map((f) => f.key)).toEqual(UNIVERSE);
      expect(service.availableFeatures().every((f) => f.enabled)).toBe(true);

      service.setPartOfSpeech('verb');
      TestBed.tick();

      expect(
        service
          .availableFeatures()
          .filter((f) => f.enabled)
          .map((f) => f.key),
      ).toEqual(VERB_FEATURES);
    });
  });
});
