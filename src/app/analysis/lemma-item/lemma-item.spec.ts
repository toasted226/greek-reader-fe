import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LemmaItem } from './lemma-item';
import { LemmaResponse } from '../../../api';
import { SavedLemmasService } from '../saved-lemmas.service';

describe('LemmaItem', () => {
  let component: LemmaItem;
  let fixture: ComponentFixture<LemmaItem>;

  const mockLemma: LemmaResponse = {
    id: 12,
    lemma: 'λόγος',
    pos: 'Noun',
    glosses: ['word', 'speech', 'reason'],
    forms: [
      { form: 'λόγος', features: ['nom', 'masc', 'sg'] },
      { form: 'λόγου', features: ['gen', 'masc', 'sg'] },
    ],
    examples: [
      { greek: 'Ἐν ἀρχῇ ἦν ὁ λόγος.', english: 'In the beginning was the Word.' },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LemmaItem],
      providers: [{
        provide: SavedLemmasService,
        useValue: { isSaved: () => false, toggle: vi.fn() },
      }],
    }).compileComponents();

    fixture = TestBed.createComponent(LemmaItem);
    component = fixture.componentInstance;
  });

  it('should create and render lemma, pos badge, glosses, forms, and examples', () => {
    fixture.componentRef.setInput('lemma', mockLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Lemma title & POS
    expect(compiled.textContent).toContain('λόγος');
    expect(compiled.textContent).toContain('Noun');

    // Glosses
    expect(compiled.textContent).toContain('Definitions');
    expect(compiled.textContent).toContain('word, speech, reason');

    // Inflected forms
    expect(compiled.textContent).toContain('Inflections');
    expect(compiled.textContent).toContain('λόγου');
    expect(compiled.textContent).toContain('gen, masc, sg');

    // Examples
    expect(compiled.textContent).toContain('Examples');
    expect(compiled.textContent).toContain('Ἐν ἀρχῇ ἦν ὁ λόγος.');
    expect(compiled.textContent).toContain('In the beginning was the Word.');
  });

  it('should gracefully handle lemma without pos, glosses, forms, or examples', () => {
    const minimalLemma: LemmaResponse = {
      id: 13,
      lemma: 'καί',
      pos: '',
      glosses: [],
      forms: [],
      examples: [],
    };

    fixture.componentRef.setInput('lemma', minimalLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('καί');
    expect(compiled.textContent).not.toContain('Definitions');
    expect(compiled.textContent).not.toContain('Inflections');
    expect(compiled.textContent).not.toContain('Examples');
  });
});
