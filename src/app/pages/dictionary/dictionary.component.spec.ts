import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LexiconEndpointsService, LemmaPageResponse, LemmaResponse } from '../../../api';
import { DictionaryComponent } from './dictionary.component';

describe('DictionaryComponent', () => {
  const lemma: LemmaResponse = {
    id: 12,
    lemma: 'λόγος',
    pos: 'Noun',
    glosses: ['word'],
    examples: [],
    forms: [],
  };
  const page: LemmaPageResponse = { items: [lemma], offset: 0, limit: 20, total: 1 };

  let lexiconServiceMock: {
    lexiconQueryGet: ReturnType<typeof vi.fn>;
    lexiconFeaturesGet: ReturnType<typeof vi.fn>;
    lemmasGet: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    lexiconServiceMock = {
      lexiconQueryGet: vi.fn().mockReturnValue(of(page)),
      lexiconFeaturesGet: vi.fn().mockReturnValue(of({ features: [] })),
      lemmasGet: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [DictionaryComponent],
      providers: [{ provide: LexiconEndpointsService, useValue: lexiconServiceMock }],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DictionaryComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the Dictionary heading and the shared filter', () => {
    const fixture = TestBed.createComponent(DictionaryComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Dictionary');
    expect(compiled.querySelector('app-lemma-filter')).toBeTruthy();
    // Saved-words-only fields are hidden on this surface.
    expect(compiled.querySelector('[id$="-min-date"]')).toBeNull();
    expect(compiled.querySelector('[id$="-max-date"]')).toBeNull();
    expect(compiled.textContent).not.toContain('Latest');
    expect(compiled.textContent).not.toContain('Saved from');
  });

  it('should label the example search for the lexicon once filters are expanded', () => {
    const fixture = TestBed.createComponent(DictionaryComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // The example search lives in the collapsed "More filters" section.
    const moreButton = compiled.querySelector<HTMLButtonElement>('button[aria-controls$="-more"]');
    expect(moreButton?.textContent).toContain('More filters');
    moreButton?.click();
    fixture.detectChanges();

    const exampleInput = compiled.querySelector<HTMLInputElement>('[id$="-example"]');
    expect(exampleInput?.placeholder).toBe('Search example sentences…');
    expect(exampleInput?.getAttribute('aria-label')).toBe('Filter by Example sentences text');
  });

  it('should request the first page with a limit of 20 and render its lemmas', () => {
    const fixture = TestBed.createComponent(DictionaryComponent);
    fixture.detectChanges();

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
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('λόγος');
  });

  it('should show an empty state when the page has no lemmas', () => {
    lexiconServiceMock.lexiconQueryGet.mockReturnValue(
      of({ items: [], offset: 0, limit: 20, total: 0 }),
    );
    const fixture = TestBed.createComponent(DictionaryComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No lemmas found.');
  });

  it('should show an error with a retry that reloads the page', () => {
    lexiconServiceMock.lexiconQueryGet.mockReturnValue(throwError(() => new Error('boom')));
    const fixture = TestBed.createComponent(DictionaryComponent);
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Lemmas could not be loaded.');

    lexiconServiceMock.lexiconQueryGet.mockReturnValue(of(page));
    const retryButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Try again',
    );
    retryButton?.click();
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('λόγος');
    expect(lexiconServiceMock.lexiconQueryGet).toHaveBeenCalledTimes(2);
  });

  it('should page forward and back with controls at the top and bottom', () => {
    lexiconServiceMock.lexiconQueryGet.mockImplementation(
      (
        _pos: unknown,
        _lemma: unknown,
        _form: unknown,
        _contains: unknown,
        _example: unknown,
        _features: unknown,
        offset: number,
        limit: number,
      ) =>
        of({
          items: Array.from({ length: Math.min(limit, 45 - offset) }, (_, i) => ({
            id: offset + i + 1,
            lemma: `lemma-${offset + i + 1}`,
            pos: 'Noun',
            glosses: [],
            examples: [],
            forms: [],
          })),
          offset,
          limit,
          total: 45,
        }),
    );

    const fixture = TestBed.createComponent(DictionaryComponent);
    fixture.detectChanges();

    const getNavs = () =>
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        'nav[aria-label="Dictionary pages"]',
      );
    const getButtons = (nav: HTMLElement) => nav.querySelectorAll<HTMLButtonElement>('button');

    expect(getNavs().length).toBe(2);
    expect(getNavs()[0].textContent).toContain('1–20 of 45');
    expect(getButtons(getNavs()[0])[0].disabled).toBe(true);

    getButtons(getNavs()[0])[1].click();
    fixture.detectChanges();
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
    expect(getNavs()[0].textContent).toContain('21–40 of 45');
    expect(getButtons(getNavs()[0])[0].disabled).toBe(false);

    getButtons(getNavs()[1])[1].click();
    fixture.detectChanges();
    expect(getNavs()[1].textContent).toContain('41–45 of 45');
    expect(getButtons(getNavs()[1])[1].disabled).toBe(true);

    getButtons(getNavs()[1])[0].click();
    fixture.detectChanges();
    expect(getNavs()[1].textContent).toContain('21–40 of 45');
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
  });
});
