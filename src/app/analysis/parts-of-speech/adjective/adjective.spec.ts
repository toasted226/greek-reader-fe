import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Adjective } from './adjective';
import { LemmaResponse } from '../../../../api';

describe('Adjective', () => {
  let component: Adjective;
  let fixture: ComponentFixture<Adjective>;

  const mockAdjectiveLemma: LemmaResponse = {
    id: 5,
    lemma: 'καλός',
    pos: 'adjective',
    glosses: ['good', 'beautiful'],
    forms: [
      { form: 'καλός', features: ['masculine', 'nominative', 'singular', 'positive'] },
      { form: 'καλοῦ', features: ['masculine', 'genitive', 'singular', 'positive'] },
      { form: 'καλοί', features: ['masculine', 'nominative', 'plural', 'positive'] },
      { form: 'καλή', features: ['feminine', 'nominative', 'singular', 'positive'] },
      { form: 'καλόν', features: ['neuter', 'nominative', 'singular', 'positive'] },
      { form: 'καλλίων', features: ['masculine', 'nominative', 'singular', 'comparative'] },
      { form: 'κάλλιστος', features: ['masculine', 'nominative', 'singular', 'superlative'] },
    ],
    examples: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adjective],
    }).compileComponents();

    fixture = TestBed.createComponent(Adjective);
    component = fixture.componentInstance;
  });

  it('should render one table per degree', () => {
    fixture.componentRef.setInput('lemma', mockAdjectiveLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tables = compiled.querySelectorAll('table');

    expect(tables.length).toBe(3);
    expect(tables[0].textContent).toContain('Positive');
    expect(tables[1].textContent).toContain('Comparative');
    expect(tables[2].textContent).toContain('Superlative');
  });

  it('should render gender, number and case headers', () => {
    fixture.componentRef.setInput('lemma', mockAdjectiveLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Masculine');
    expect(compiled.textContent).toContain('Feminine');
    expect(compiled.textContent).toContain('Neuter');
    expect(compiled.textContent).toContain('Singular');
    expect(compiled.textContent).toContain('Plural');
    expect(compiled.textContent).toContain('Nominative');
    expect(compiled.textContent).toContain('Accusative');
    expect(compiled.textContent).toContain('Genitive');
    expect(compiled.textContent).toContain('Vocative');
  });

  it('should populate cells with matching forms', () => {
    fixture.componentRef.setInput('lemma', mockAdjectiveLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('καλός');
    expect(compiled.textContent).toContain('καλοῦ');
    expect(compiled.textContent).toContain('καλοί');
    expect(compiled.textContent).toContain('καλή');
    expect(compiled.textContent).toContain('καλόν');
    expect(compiled.textContent).toContain('καλλίων');
    expect(compiled.textContent).toContain('κάλλιστος');
  });

  it('should only render tables for degrees that have forms', () => {
    fixture.componentRef.setInput('lemma', {
      ...mockAdjectiveLemma,
      forms: mockAdjectiveLemma.forms.filter((form) => form.features.includes('positive')),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tables = compiled.querySelectorAll('table');

    expect(tables.length).toBe(1);
    expect(tables[0].textContent).toContain('Positive');
    expect(compiled.textContent).not.toContain('Comparative');
    expect(compiled.textContent).not.toContain('Superlative');
  });

  it('should show dashes for missing forms', () => {
    fixture.componentRef.setInput('lemma', mockAdjectiveLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const values = Array.from(compiled.querySelectorAll('.inflection-value'));

    expect(values.some((value) => value.textContent?.trim() === '-')).toBe(true);
  });
});
