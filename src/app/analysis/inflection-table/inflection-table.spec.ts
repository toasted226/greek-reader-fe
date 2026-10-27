import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InflectionTable } from './inflection-table';
import { LemmaResponse } from '../../../api';

describe('InflectionTable', () => {
  let component: InflectionTable;
  let fixture: ComponentFixture<InflectionTable>;

  const mockNounLemma: LemmaResponse = {
    id: 6,
    lemma: 'λόγος',
    pos: 'noun',
    glosses: ['word', 'speech', 'reason'],
    forms: [
      { form: 'λόγος', features: ['nominative', 'singular'] },
      { form: 'λόγου', features: ['genitive', 'singular'] },
      { form: 'λόγον', features: ['accusative', 'singular'] },
      { form: 'λόγοι', features: ['nominative', 'plural'] },
      { form: 'λόγους', features: ['accusative', 'plural'] },
      { form: 'λόγων', features: ['genitive', 'plural'] },
    ],
    examples: [],
  };

  const mockAdjectiveLemma: LemmaResponse = {
    id: 7,
    lemma: 'καλός',
    pos: 'adjective',
    glosses: ['good'],
    forms: [
      { form: 'καλός', features: ['masculine', 'nominative', 'singular', 'positive'] },
      { form: 'καλή', features: ['feminine', 'nominative', 'singular', 'positive'] },
      { form: 'καλόν', features: ['neuter', 'nominative', 'singular', 'positive'] },
      { form: 'καλλίων', features: ['masculine', 'nominative', 'singular', 'comparative'] },
      { form: 'κάλλιστος', features: ['masculine', 'nominative', 'singular', 'superlative'] },
    ],
    examples: [],
  };

  const mockPronounLemma: LemmaResponse = {
    id: 8,
    lemma: 'αὐτός',
    pos: 'pronoun',
    glosses: ['he, she, it'],
    forms: [
      { form: 'αὐτός', features: ['masculine', 'nominative', 'singular'] },
      { form: 'αὐτοῦ', features: ['masculine', 'genitive', 'singular'] },
      { form: 'αὐτή', features: ['feminine', 'nominative', 'singular'] },
    ],
    examples: [],
  };

  const mockArticleLemma: LemmaResponse = {
    id: 9,
    lemma: 'ο',
    pos: 'article',
    glosses: ['the'],
    forms: [
      { form: 'ο', features: ['definite', 'masculine', 'nominative', 'singular'] },
      { form: 'οι', features: ['definite', 'masculine', 'nominative', 'plural'] },
      { form: 'η', features: ['definite', 'feminine', 'nominative', 'singular'] },
    ],
    examples: [],
  };

  const mockNumeralLemma: LemmaResponse = {
    id: 10,
    lemma: 'εἷς',
    pos: 'numeral',
    glosses: ['one'],
    forms: [
      { form: 'εἷς', features: ['masculine', 'nominative'] },
      { form: 'μία', features: ['feminine', 'nominative'] },
      { form: 'ἕν', features: ['neuter', 'nominative'] },
    ],
    examples: [],
  };

  const mockVerbLemma: LemmaResponse = {
    id: 11,
    lemma: 'εἰμί',
    pos: 'verb',
    glosses: ['I am'],
    forms: [
      { form: 'εἰμί', features: ['indicative', 'active', 'imperfective', 'present', 'first-person', 'singular'] },
      { form: 'εἶ', features: ['indicative', 'active', 'imperfective', 'present', 'second-person', 'singular'] },
    ],
    examples: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InflectionTable],
    }).compileComponents();

    fixture = TestBed.createComponent(InflectionTable);
    component = fixture.componentInstance;
  });

  it('should delegate noun inflections to the noun component', () => {
    fixture.componentRef.setInput('lemma', mockNounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const noun = compiled.querySelector('app-noun');

    expect(noun).not.toBeNull();
    expect(noun?.querySelectorAll('table').length).toBe(1);
    expect(compiled.textContent).toContain('Case');
    expect(compiled.textContent).toContain('Singular');
    expect(compiled.textContent).toContain('Plural');
  });

  it('should render noun inflection table with case headers', () => {
    fixture.componentRef.setInput('lemma', mockNounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Inflections');
    expect(compiled.textContent).toContain('Case');
    expect(compiled.textContent).toContain('Singular');
    expect(compiled.textContent).toContain('Plural');
    expect(compiled.textContent).toContain('Nominative');
    expect(compiled.textContent).toContain('Accusative');
    expect(compiled.textContent).toContain('Genitive');
    expect(compiled.textContent).toContain('Vocative');
  });

  it('should populate noun table cells with matching forms', () => {
    fixture.componentRef.setInput('lemma', mockNounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('λόγος');
    expect(compiled.textContent).toContain('λόγου');
    expect(compiled.textContent).toContain('λόγον');
    expect(compiled.textContent).toContain('λόγοι');
    expect(compiled.textContent).toContain('λόγους');
    expect(compiled.textContent).toContain('λόγων');
  });

  it('should show dash for missing noun forms', () => {
    fixture.componentRef.setInput('lemma', mockNounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Vocative forms are not in mockNounLemma, so dashes should appear
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(4);
  });

  it('should delegate adjective inflections to the adjective component', () => {
    fixture.componentRef.setInput('lemma', mockAdjectiveLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const adjective = compiled.querySelector('app-adjective');

    expect(adjective).not.toBeNull();
    expect(adjective?.querySelectorAll('table').length).toBe(3);
    expect(compiled.textContent).toContain('Positive');
    expect(compiled.textContent).toContain('Comparative');
    expect(compiled.textContent).toContain('Superlative');
  });

  it('should delegate pronoun inflections to the pronoun component', () => {
    fixture.componentRef.setInput('lemma', mockPronounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const pronoun = compiled.querySelector('app-pronoun');

    expect(pronoun).not.toBeNull();
    expect(pronoun?.querySelectorAll('table').length).toBe(2);
    expect(compiled.textContent).toContain('Masculine');
    expect(compiled.textContent).toContain('Feminine');
    expect(compiled.textContent).toContain('Case');
    expect(compiled.textContent).toContain('Singular');
    expect(compiled.textContent).toContain('Plural');
  });

  it('should delegate article inflections to the article component', () => {
    fixture.componentRef.setInput('lemma', mockArticleLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const article = compiled.querySelector('app-article');

    expect(article).not.toBeNull();
    expect(article?.querySelectorAll('table').length).toBe(2);
    expect(compiled.textContent).toContain('Masculine');
    expect(compiled.textContent).toContain('Feminine');
    expect(compiled.textContent).toContain('Case');
    expect(compiled.textContent).toContain('Singular');
    expect(compiled.textContent).toContain('Plural');
  });

  it('should delegate numeral inflections to the numeral component', () => {
    fixture.componentRef.setInput('lemma', mockNumeralLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const numeral = compiled.querySelector('app-numeral');

    expect(numeral).not.toBeNull();
    expect(numeral?.querySelectorAll('table').length).toBe(3);
    expect(compiled.textContent).toContain('Case');
    expect(compiled.textContent).toContain('Form');
    expect(compiled.textContent).not.toContain('Singular');
    expect(compiled.textContent).not.toContain('Plural');
  });

  it('should delegate verb forms to the verb inflection table', () => {
    fixture.componentRef.setInput('lemma', mockVerbLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('εἰμί');
    expect(compiled.textContent).toContain('εἶ');
    expect(compiled.querySelector('app-verb')).not.toBeNull();
    expect(compiled.textContent).toContain('Indicative · Active · Imperfective · Present');
    expect(compiled.textContent).toContain('εἰμί');
    expect(compiled.textContent).toContain('Singular');
    expect(compiled.textContent).toContain('Plural');
    expect(compiled.querySelectorAll('table').length).toBe(1);
  });
});
