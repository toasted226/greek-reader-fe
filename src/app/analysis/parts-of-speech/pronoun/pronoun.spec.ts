import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pronoun } from './pronoun';
import { LemmaResponse } from '../../../../api';

describe('Pronoun', () => {
  let component: Pronoun;
  let fixture: ComponentFixture<Pronoun>;

  const mockPronounLemma: LemmaResponse = {
    id: 3,
    lemma: 'αὐτός',
    pos: 'pronoun',
    glosses: ['he, she, it'],
    forms: [
      { form: 'αὐτός', features: ['masculine', 'nominative', 'singular'] },
      { form: 'αὐτοῦ', features: ['masculine', 'genitive', 'singular'] },
      { form: 'αὐτὸν', features: ['masculine', 'accusative', 'singular'] },
      { form: 'αὐτοί', features: ['masculine', 'nominative', 'plural'] },
      { form: 'αὐτῶν', features: ['masculine', 'genitive', 'plural'] },
      { form: 'αὐτούς', features: ['masculine', 'accusative', 'plural'] },
      { form: 'αὐτή', features: ['feminine', 'nominative', 'singular'] },
      { form: 'αὐτῆς', features: ['feminine', 'genitive', 'singular'] },
      { form: 'αὐτήν', features: ['feminine', 'accusative', 'singular'] },
      { form: 'αὐταί', features: ['feminine', 'nominative', 'plural'] },
      { form: 'αὐτῶν', features: ['feminine', 'genitive', 'plural'] },
      { form: 'αὐτάς', features: ['feminine', 'accusative', 'plural'] },
    ],
    examples: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pronoun],
    }).compileComponents();

    fixture = TestBed.createComponent(Pronoun);
    component = fixture.componentInstance;
  });

  it('should render at most one table per gender with forms', () => {
    fixture.componentRef.setInput('lemma', mockPronounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tables = compiled.querySelectorAll('table');

    expect(tables.length).toBe(2);
    expect(compiled.textContent).toContain('Masculine');
    expect(compiled.textContent).toContain('Feminine');
    expect(compiled.textContent).not.toContain('Neuter');
  });

  it('should render case, singular and plural headers', () => {
    fixture.componentRef.setInput('lemma', mockPronounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Case');
    expect(compiled.textContent).toContain('Singular');
    expect(compiled.textContent).toContain('Plural');
    expect(compiled.textContent).toContain('Nominative');
    expect(compiled.textContent).toContain('Accusative');
    expect(compiled.textContent).toContain('Genitive');
    expect(compiled.textContent).toContain('Vocative');
  });

  it('should populate tables with matching forms', () => {
    fixture.componentRef.setInput('lemma', mockPronounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('αὐτός');
    expect(compiled.textContent).toContain('αὐτοῦ');
    expect(compiled.textContent).toContain('αὐτὸν');
    expect(compiled.textContent).toContain('αὐτή');
    expect(compiled.textContent).toContain('αὐτῆς');
    expect(compiled.textContent).toContain('αὐτήν');
  });

  it('should show dashes for missing forms', () => {
    fixture.componentRef.setInput('lemma', mockPronounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const values = Array.from(compiled.querySelectorAll('.inflection-value'));

    expect(values.some((value) => value.textContent?.trim() === '-')).toBe(true);
  });
});
