import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Numeral } from './numeral';
import { LemmaResponse } from '../../../../api';

describe('Numeral', () => {
  let component: Numeral;
  let fixture: ComponentFixture<Numeral>;

  const mockNumeralLemma: LemmaResponse = {
    id: 1,
    lemma: 'εἷς',
    pos: 'numeral',
    glosses: ['one'],
    forms: [
      { form: 'εἷς', features: ['masculine', 'nominative'] },
      { form: 'ἕνα', features: ['masculine', 'accusative'] },
      { form: 'ἑνός', features: ['masculine', 'genitive'] },
      { form: 'μία', features: ['feminine', 'nominative'] },
      { form: 'μίαν', features: ['feminine', 'accusative'] },
      { form: 'μιᾶς', features: ['feminine', 'genitive'] },
      { form: 'ἕν', features: ['neuter', 'nominative'] },
      { form: 'ἕν', features: ['neuter', 'accusative'] },
      { form: 'ἑνός', features: ['neuter', 'genitive'] },
    ],
    examples: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Numeral],
    }).compileComponents();

    fixture = TestBed.createComponent(Numeral);
    component = fixture.componentInstance;
  });

  it('should render one table per gender', () => {
    fixture.componentRef.setInput('lemma', mockNumeralLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tables = compiled.querySelectorAll('table');

    expect(tables.length).toBe(3);
    expect(compiled.textContent).toContain('Masculine');
    expect(compiled.textContent).toContain('Feminine');
    expect(compiled.textContent).toContain('Neuter');
  });

  it('should render supported case and form headers without singular/plural', () => {
    fixture.componentRef.setInput('lemma', mockNumeralLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Case');
    expect(compiled.textContent).toContain('Form');
    expect(compiled.textContent).not.toContain('Singular');
    expect(compiled.textContent).not.toContain('Plural');
    expect(compiled.textContent).toContain('Nominative');
    expect(compiled.textContent).toContain('Accusative');
    expect(compiled.textContent).toContain('Genitive');
    expect(compiled.textContent).not.toContain('Vocative');
  });

  it('should populate tables with matching forms', () => {
    fixture.componentRef.setInput('lemma', mockNumeralLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('εἷς');
    expect(compiled.textContent).toContain('ἕνα');
    expect(compiled.textContent).toContain('μία');
    expect(compiled.textContent).toContain('μίαν');
    expect(compiled.textContent).toContain('ἕν');
  });

  it('should render the available forms for each supported case', () => {
    fixture.componentRef.setInput('lemma', mockNumeralLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const values = Array.from(compiled.querySelectorAll('.inflection-value'));

    expect(values).toHaveLength(9);
    expect(values.every((value) => value.textContent?.trim() !== '-')).toBe(true);
  });
});
