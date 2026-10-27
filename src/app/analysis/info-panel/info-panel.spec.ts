import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoPanel } from './info-panel';
import { AnalysisService } from '../analysis.service';
import { AnalyseResponse } from '../../../api/models';
import { SavedLemmasService } from '../saved-lemmas.service';

describe('InfoPanel', () => {
  let component: InfoPanel;
  let fixture: ComponentFixture<InfoPanel>;
  let analysisService: AnalysisService;

  const mockTokenWithLemmas: AnalyseResponse = {
    token: { text: 'σκύλος', start: 0, isWord: true },
    lemmas: [
      {
        id: 16,
        lemma: 'σκύλος',
        pos: 'Noun',
        glosses: ['dog', 'hound'],
        forms: [
          { form: 'σκύλος', features: ['nom', 'masc', 'sg'] },
          { form: 'σκύλου', features: ['gen', 'masc', 'sg'] },
        ],
        examples: [
          { greek: 'Ο σκύλος γαβγίζει.', english: 'The dog barks.' },
        ],
      },
    ],
  };

  const mockTokens: AnalyseResponse[] = [
    {
      token: { text: 'Ο', start: 0, isWord: true },
      lemmas: [],
    },
    {
      token: { text: ' ', start: 1, isWord: false },
      lemmas: [],
    },
    mockTokenWithLemmas,
    {
      token: { text: '.', start: 8, isWord: false },
      lemmas: [],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoPanel],
      providers: [
        AnalysisService,
        { provide: SavedLemmasService, useValue: { isSaved: () => false, toggle: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoPanel);
    component = fixture.componentInstance;
    analysisService = TestBed.inject(AnalysisService);
  });

  it('should render empty state prompt when no token is selected', async () => {
    analysisService.selectedToken.set(null);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Lemmas');
    expect(compiled.textContent).toContain('Click on any word');
  });

  it('should display selected token, sentence context, lemma, glosses, forms, and examples', async () => {
    analysisService.tokens.set(mockTokens);
    analysisService.selectedToken.set(mockTokenWithLemmas);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    // Header badge
    expect(compiled.textContent).toContain('σκύλος');

    // Sentence context
    expect(compiled.textContent).toContain('Sentence Context');
    expect(compiled.textContent).toContain('Ο σκύλος.');

    // Lemma details
    expect(compiled.textContent).toContain('Noun');
    expect(compiled.textContent).toContain('dog, hound');
    expect(compiled.textContent).toContain('nom, masc, sg');
    expect(compiled.textContent).toContain('Ο σκύλος γαβγίζει.');
    expect(compiled.textContent).toContain('The dog barks.');
  });

  it('should show notice when selected word has no dictionary lemma entries', async () => {
    const unknownToken: AnalyseResponse = {
      token: { text: 'άγνωστο', start: 0, isWord: true },
      lemmas: [],
    };

    analysisService.tokens.set([unknownToken]);
    analysisService.selectedToken.set(unknownToken);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No lexical dictionary entries found');
  });
});
