import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Analysis } from './analysis';
import { LexiconEndpointsService } from '../../api/services/lexiconEndpoints.service';
import { AnalyseResponse } from '../../api/models';

describe('Analysis', () => {
  let component: Analysis;
  let fixture: ComponentFixture<Analysis>;
  let lexiconServiceMock: {
    lexiconAnalysePost: ReturnType<typeof vi.fn>;
  };

  const mockTokens: AnalyseResponse[] = [
    {
      token: { text: 'Καλημέρα', start: 0, isWord: true },
      lemmas: [
        {
          id: 18,
          lemma: 'καλημέρα',
          pos: 'Noun',
          glosses: ['good morning'],
          examples: [],
          forms: [],
        },
      ],
    },
    {
      token: { text: '!', start: 8, isWord: false },
      lemmas: [],
    },
  ];

  beforeEach(async () => {
    lexiconServiceMock = {
      lexiconAnalysePost: vi.fn().mockReturnValue(of(mockTokens)),
    };

    await TestBed.configureTestingModule({
      imports: [Analysis],
      providers: [
        { provide: LexiconEndpointsService, useValue: lexiconServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Analysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a multiline textbox and an Analyse button taking full width', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const textarea = compiled.querySelector('textarea');
    expect(textarea).toBeTruthy();
    expect(textarea?.classList).toContain('w-full');

    const button = compiled.querySelector('button');
    expect(button).toBeTruthy();
    expect(button?.textContent?.trim()).toBe('Analyse');
    expect(button?.classList).toContain('w-full');
  });

  it('should have the analyse button disabled when input text is empty or whitespace', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    component.inputText.set('   ');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });

  it('should call lexiconAnalysePost when Analyse button is clicked and store returned tokens', async () => {
    component.inputText.set('Καλημέρα!');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(lexiconServiceMock.lexiconAnalysePost).toHaveBeenCalledWith({ text: 'Καλημέρα!' });
    expect(component.tokens()).toEqual(mockTokens);
    expect(component.isLoading()).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    lexiconServiceMock.lexiconAnalysePost.mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    component.inputText.set('Καλημέρα');
    component.analyseText();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Network error');
    expect(component.isLoading()).toBe(false);
    expect(component.tokens()).toBeNull();
  });

  it('should render interactive tokens in token container when tokens are available and auto-select first word', async () => {
    component.inputText.set('Καλημέρα!');
    component.analyseText();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('textarea')).toBeNull();

    const tokenContainer = compiled.querySelector('[data-testid="token-container"]');
    expect(tokenContainer).toBeTruthy();

    const tokenElements = compiled.querySelectorAll('app-token');
    expect(tokenElements.length).toBe(2);
    expect(component.selectedToken()).toEqual(mockTokens[0]);
    expect(compiled.textContent).toContain('100% Coverage');
  });

  it('should allow selecting a different word token and clearing analysis back to text input', async () => {
    const multiTokens: AnalyseResponse[] = [
      {
        token: { text: 'Γεια', start: 0, isWord: true },
        lemmas: [],
      },
      {
        token: { text: ' ', start: 4, isWord: false },
        lemmas: [],
      },
      {
        token: { text: 'σου', start: 5, isWord: true },
        lemmas: [],
      },
    ];
    lexiconServiceMock.lexiconAnalysePost.mockReturnValue(of(multiTokens));

    component.inputText.set('Γεια σου');
    component.analyseText();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const tokenElements = compiled.querySelectorAll('app-token');
    const secondWordButton = tokenElements[2].querySelector('span[role="button"]') as HTMLElement;
    expect(secondWordButton).toBeTruthy();

    secondWordButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.selectedToken()).toEqual(multiTokens[2]);

    const editButton = compiled.querySelector('header button') as HTMLButtonElement;
    expect(editButton?.textContent?.trim()).toBe('Edit text');

    editButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.tokens()).toBeNull();
    expect(component.selectedToken()).toBeNull();
    expect(compiled.querySelector('textarea')).toBeTruthy();
  });
});
