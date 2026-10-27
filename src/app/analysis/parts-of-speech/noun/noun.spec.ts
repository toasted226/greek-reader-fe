import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Noun } from './noun';
import { LemmaResponse } from '../../../../api';

describe('Noun', () => {
  let component: Noun;
  let fixture: ComponentFixture<Noun>;

  const mockNounLemma: LemmaResponse = {
    id: 4,
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Noun],
    }).compileComponents();

    fixture = TestBed.createComponent(Noun);
    component = fixture.componentInstance;
  });

  it('should render a single inflection table', () => {
    fixture.componentRef.setInput('lemma', mockNounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('table').length).toBe(1);
    expect(compiled.textContent).toContain('Case');
    expect(compiled.textContent).toContain('Singular');
    expect(compiled.textContent).toContain('Plural');
  });

  it('should render case labels', () => {
    fixture.componentRef.setInput('lemma', mockNounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Nominative');
    expect(compiled.textContent).toContain('Accusative');
    expect(compiled.textContent).toContain('Genitive');
    expect(compiled.textContent).toContain('Vocative');
  });

  it('should populate table cells with matching forms', () => {
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

  it('should show dashes for missing forms', () => {
    fixture.componentRef.setInput('lemma', mockNounLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const values = Array.from(compiled.querySelectorAll('.inflection-value'));

    expect(values.some((value) => value.textContent?.trim() === '-')).toBe(true);
  });
});
