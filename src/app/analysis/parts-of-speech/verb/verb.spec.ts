import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Verb } from './verb';
import { LemmaResponse } from '../../../../api';

describe('Verb', () => {
  let component: Verb;
  let fixture: ComponentFixture<Verb>;

  /** Shape mirrored from the live `GET /lexicon/query` response for γράφω. */
  const mockVerbLemma: LemmaResponse = {
    id: 10,
    lemma: 'γράφω',
    pos: 'verb',
    glosses: ['to write'],
    forms: [
      { form: 'γράφω', features: ['indicative', 'active', 'imperfective', 'present', 'first-person', 'singular'] },
      { form: 'γράφουμε', features: ['indicative', 'active', 'imperfective', 'present', 'first-person', 'plural'] },
      { form: 'γράψει', features: ['active', 'aorist', 'infinitive'] },
      { form: 'γραφτεί', features: ['aorist', 'infinitive', 'passive'] },
      { form: 'γράφοντας', features: ['active', 'participle', 'present'] },
      { form: 'γραμμένος', features: ['participle', 'passive', 'past'] },
    ],
    examples: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Verb],
    }).compileComponents();

    fixture = TestBed.createComponent(Verb);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('lemma', mockVerbLemma);
    fixture.detectChanges();
  });

  it('builds infinitive rows from the "infinitive" feature', () => {
    expect(component.infinitiveForms).toEqual([
      { voice: 'Active', form: 'γράψει' },
      { voice: 'Passive', form: 'γραφτεί' },
    ]);
  });

  it('does not leak infinitives into the "other forms" table', () => {
    expect(component.otherForms).toEqual([]);
  });

  it('renders an Infinitives table', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Infinitives');
    expect(compiled.textContent).toContain('γράψει');
    expect(compiled.textContent).toContain('γραφτεί');
  });

  it('groups finite forms by mood, tense and voice', () => {
    expect(component.groups.map((group) => group.label)).toEqual([
      'Indicative · Active · Imperfective · Present',
    ]);
  });

  it('collects participles with their tense and voice', () => {
    expect(component.participleForms).toEqual([
      { tense: 'Present', voice: 'Active', form: 'γράφοντας' },
      { tense: 'Past', voice: 'Passive', form: 'γραμμένος' },
    ]);
  });
});
