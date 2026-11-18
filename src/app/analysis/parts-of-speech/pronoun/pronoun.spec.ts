import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pronoun } from './pronoun';
import { LemmaResponse } from '../../../../api';

describe('Pronoun', () => {
  let component: Pronoun;
  let fixture: ComponentFixture<Pronoun>;

  const mockPronounLemma: LemmaResponse = {
    id: 3,
    lemma: 'αυτός',
    pos: 'pronoun',
    glosses: ['he, she, it'],
    forms: [
      { form: 'αυτός', features: ['masculine', 'nominative', 'singular'] },
      { form: 'αυτού', features: ['masculine', 'genitive', 'singular'] },
      { form: 'αυτόν', features: ['masculine', 'accusative', 'singular'] },
      { form: 'αυτοί', features: ['masculine', 'nominative', 'plural'] },
      { form: 'αυτών', features: ['masculine', 'genitive', 'plural'] },
      { form: 'αυτούς', features: ['masculine', 'accusative', 'plural'] },
      { form: 'αυτή', features: ['feminine', 'nominative', 'singular'] },
      { form: 'αυτής', features: ['feminine', 'genitive', 'singular'] },
      { form: 'αυτήν', features: ['feminine', 'accusative', 'singular'] },
      { form: 'αυτές', features: ['feminine', 'nominative', 'plural'] },
      { form: 'αυτών', features: ['feminine', 'genitive', 'plural'] },
      { form: 'αυτές', features: ['feminine', 'accusative', 'plural'] },
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

    expect(compiled.textContent).toContain('αυτός');
    expect(compiled.textContent).toContain('αυτού');
    expect(compiled.textContent).toContain('αυτόν');
    expect(compiled.textContent).toContain('αυτή');
    expect(compiled.textContent).toContain('αυτής');
    expect(compiled.textContent).toContain('αυτήν');
  });

  it('should show dashes for missing forms', () => {
    fixture.componentRef.setInput('lemma', mockPronounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const values = Array.from(compiled.querySelectorAll('.inflection-value'));

    expect(values.some((value) => value.textContent?.trim() === '-')).toBe(true);
  });
});
