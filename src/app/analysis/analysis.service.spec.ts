import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AnalysisService, extractSentenceForToken } from './analysis.service';
import { LexiconEndpointsService } from '../../api/services/lexiconEndpoints.service';
import { AnalyseResponse } from '../../api/models';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let lexiconServiceMock: { lexiconAnalysePost: ReturnType<typeof vi.fn> };

  const mockTokens: AnalyseResponse[] = [
    {
      token: { text: 'Ο', start: 0, isWord: true },
      lemmas: [
        {
          id: 14,
          lemma: 'ὁ',
          pos: 'Article',
          glosses: ['the'],
          examples: [],
          forms: [{ form: 'Ο', features: ['nom', 'masc', 'sg'] }],
        },
      ],
    },
    {
      token: { text: ' ', start: 1, isWord: false },
      lemmas: [],
    },
    {
      token: { text: 'σκύλος', start: 2, isWord: true },
      lemmas: [
        {
          id: 15,
          lemma: 'σκύλος',
          pos: 'Noun',
          glosses: ['dog'],
          examples: [{ greek: 'Ο σκύλος γαβγίζει', english: 'The dog barks' }],
          forms: [{ form: 'σκύλος', features: ['nom', 'masc', 'sg'] }],
        },
      ],
    },
    {
      token: { text: '.', start: 8, isWord: false },
      lemmas: [],
    },
    {
      token: { text: ' ', start: 9, isWord: false },
      lemmas: [],
    },
    {
      token: { text: 'Η', start: 10, isWord: true },
      lemmas: [],
    },
    {
      token: { text: ' ', start: 11, isWord: false },
      lemmas: [],
    },
    {
      token: { text: 'γάτα', start: 12, isWord: true },
      lemmas: [],
    },
    {
      token: { text: ';', start: 16, isWord: false },
      lemmas: [],
    },
  ];

  beforeEach(() => {
    lexiconServiceMock = {
      lexiconAnalysePost: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AnalysisService,
        { provide: LexiconEndpointsService, useValue: lexiconServiceMock },
      ],
    });

    service = TestBed.inject(AnalysisService);
  });

  describe('extractSentenceForToken', () => {
    it('should return empty string if tokens or selected token is missing', () => {
      expect(extractSentenceForToken(null, null)).toBe('');
      expect(extractSentenceForToken(mockTokens, null)).toBe('');
      expect(extractSentenceForToken(null, mockTokens[0])).toBe('');
    });

    it('should extract first sentence correctly for tokens in sentence 1', () => {
      const sentence = extractSentenceForToken(mockTokens, mockTokens[2]);
      expect(sentence).toBe('Ο σκύλος.');
    });

    it('should extract second sentence correctly for tokens in sentence 2 with Greek question mark', () => {
      const sentence = extractSentenceForToken(mockTokens, mockTokens[7]);
      expect(sentence).toBe('Η γάτα;');
    });
  });

  describe('Service actions and state', () => {
    it('should start with initial state', () => {
      expect(service.inputText()).toBe('');
      expect(service.tokens()).toBeNull();
      expect(service.selectedToken()).toBeNull();
      expect(service.selectedSentence()).toBe('');
      expect(service.selectedLemmas()).toEqual([]);
      expect(service.wordCount()).toBe(0);
      expect(service.isLoading()).toBe(false);
      expect(service.errorMessage()).toBeNull();
    });

    it('should analyse text, set tokens and auto-select first word', () => {
      lexiconServiceMock.lexiconAnalysePost.mockReturnValue(of(mockTokens));

      service.inputText.set('Ο σκύλος. Η γάτα;');
      service.analyseText();

      expect(lexiconServiceMock.lexiconAnalysePost).toHaveBeenCalledWith({
        text: 'Ο σκύλος. Η γάτα;',
      });
      expect(service.tokens()).toEqual(mockTokens);
      expect(service.selectedToken()).toEqual(mockTokens[0]);
      expect(service.selectedSentence()).toBe('Ο σκύλος.');
      expect(service.selectedLemmas()).toEqual(mockTokens[0].lemmas);
      expect(service.wordCount()).toBe(4);
      expect(service.isLoading()).toBe(false);
    });

    it('should allow selecting a token and update selectedLemmas and selectedSentence', () => {
      service.tokens.set(mockTokens);
      service.selectToken(mockTokens[2]);

      expect(service.selectedToken()).toEqual(mockTokens[2]);
      expect(service.selectedSentence()).toBe('Ο σκύλος.');
      expect(service.selectedLemmas()).toEqual(mockTokens[2].lemmas);
    });

    it('should handle API error gracefully', () => {
      lexiconServiceMock.lexiconAnalysePost.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      service.inputText.set('test');
      service.analyseText();

      expect(service.errorMessage()).toBe('Network error');
      expect(service.isLoading()).toBe(false);
      expect(service.tokens()).toBeNull();
    });

    it('should clear analysis state', () => {
      service.tokens.set(mockTokens);
      service.selectedToken.set(mockTokens[0]);

      service.clearAnalysis();

      expect(service.tokens()).toBeNull();
      expect(service.selectedToken()).toBeNull();
      expect(service.selectedSentence()).toBe('');
    });
  });
});
