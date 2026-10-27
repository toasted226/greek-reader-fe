import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Token } from './token';
import { AnalyseResponse } from '../../../api/models';

describe('Token', () => {
  let component: Token;
  let fixture: ComponentFixture<Token>;

  const wordTokenData: AnalyseResponse = {
    token: { text: 'άνθρωπος', start: 0, isWord: true },
    lemmas: [
      {
        id: 17,
        lemma: 'άνθρωπος',
        pos: 'Noun',
        glosses: ['human', 'person'],
        examples: [],
        forms: [],
      },
    ],
  };

  const nonWordTokenData: AnalyseResponse = {
    token: { text: ' ', start: 8, isWord: false },
    lemmas: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Token],
    }).compileComponents();

    fixture = TestBed.createComponent(Token);
    component = fixture.componentInstance;
  });

  it('should render word token with role="button" and click selection', async () => {
    fixture.componentRef.setInput('token', wordTokenData);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const wordSpan = compiled.querySelector('span[role="button"]');
    expect(wordSpan).toBeTruthy();
    expect(wordSpan?.textContent?.trim()).toBe('άνθρωπος');

    let emitted: AnalyseResponse | undefined;
    component.selected.subscribe((val) => (emitted = val));

    wordSpan?.dispatchEvent(new MouseEvent('click'));
    expect(emitted).toEqual(wordTokenData);
  });

  it('should emit selected event on Enter and Space keypress for word token', async () => {
    fixture.componentRef.setInput('token', wordTokenData);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const wordSpan = compiled.querySelector('span[role="button"]') as HTMLElement;

    let emittedCount = 0;
    component.selected.subscribe(() => emittedCount++);

    wordSpan.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emittedCount).toBe(1);

    wordSpan.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(emittedCount).toBe(2);
  });

  it('should apply selected styles when isSelected is true', async () => {
    fixture.componentRef.setInput('token', wordTokenData);
    fixture.componentRef.setInput('isSelected', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const wordSpan = compiled.querySelector('span[role="button"]');
    expect(wordSpan?.classList).toContain('bg-brand-soft');
    expect(wordSpan?.classList).toContain('text-brand-primary');
  });

  it('should render non-word token as plain text without button role', async () => {
    fixture.componentRef.setInput('token', nonWordTokenData);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttonSpan = compiled.querySelector('span[role="button"]');
    expect(buttonSpan).toBeNull();

    const textSpan = compiled.querySelector('span');
    expect(textSpan).toBeTruthy();
    expect(textSpan?.textContent).toBe(' ');
  });
});
