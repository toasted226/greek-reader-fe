import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Article } from './article';
import { LemmaResponse } from '../../../../api';

describe('Article', () => {
  let component: Article;
  let fixture: ComponentFixture<Article>;

  const mockArticleLemma: LemmaResponse = {
    id: 2,
    lemma: 'ο',
    pos: 'article',
    glosses: ['the'],
    forms: [
      { form: 'ο', features: ['definite', 'masculine', 'nominative', 'singular'] },
      { form: 'οι', features: ['definite', 'masculine', 'nominative', 'plural'] },
      { form: 'τον', features: ['definite', 'masculine', 'accusative', 'singular'] },
      { form: 'τους', features: ['definite', 'masculine', 'accusative', 'plural'] },
      { form: 'του', features: ['definite', 'masculine', 'genitive', 'singular'] },
      { form: 'των', features: ['definite', 'masculine', 'genitive', 'plural'] },
      { form: 'η', features: ['definite', 'feminine', 'nominative', 'singular'] },
      { form: 'αι', features: ['definite', 'feminine', 'nominative', 'plural'] },
      { form: 'την', features: ['definite', 'feminine', 'accusative', 'singular'] },
      { form: 'τας', features: ['definite', 'feminine', 'accusative', 'plural'] },
      { form: 'της', features: ['definite', 'feminine', 'genitive', 'singular'] },
      { form: 'των', features: ['definite', 'feminine', 'genitive', 'plural'] },
      { form: 'το', features: ['definite', 'neuter', 'nominative', 'singular'] },
      { form: 'τα', features: ['definite', 'neuter', 'nominative', 'plural'] },
      { form: 'το', features: ['definite', 'neuter', 'accusative', 'singular'] },
      { form: 'τα', features: ['definite', 'neuter', 'accusative', 'plural'] },
      { form: 'του', features: ['definite', 'neuter', 'genitive', 'singular'] },
      { form: 'των', features: ['definite', 'neuter', 'genitive', 'plural'] },
    ],
    examples: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Article],
    }).compileComponents();

    fixture = TestBed.createComponent(Article);
    component = fixture.componentInstance;
  });

  it('should render one table per gender', () => {
    fixture.componentRef.setInput('lemma', mockArticleLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tables = compiled.querySelectorAll('table');

    expect(tables.length).toBe(3);
    expect(compiled.textContent).toContain('Masculine');
    expect(compiled.textContent).toContain('Feminine');
    expect(compiled.textContent).toContain('Neuter');
  });

  it('should render case, singular and plural headers', () => {
    fixture.componentRef.setInput('lemma', mockArticleLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Case');
    expect(compiled.textContent).toContain('Singular');
    expect(compiled.textContent).toContain('Plural');
    expect(compiled.textContent).toContain('Nominative');
    expect(compiled.textContent).toContain('Accusative');
    expect(compiled.textContent).toContain('Genitive');
  });

  it('should populate tables with matching forms', () => {
    fixture.componentRef.setInput('lemma', mockArticleLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('ο');
    expect(compiled.textContent).toContain('η');
    expect(compiled.textContent).toContain('το');
  });

  it('should show dashes for missing forms', () => {
    fixture.componentRef.setInput('lemma', mockArticleLemma);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const values = Array.from(compiled.querySelectorAll('.inflection-value'));

    expect(values.length).toBeGreaterThan(0);
    expect(values.every((value) => value.textContent?.trim().length > 0)).toBe(true);
  });
});
