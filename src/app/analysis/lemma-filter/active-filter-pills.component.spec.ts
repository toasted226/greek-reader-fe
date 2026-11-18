import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LexiconEndpointsService } from '../../../api';
import { DictionaryFilterService } from '../../pages/dictionary/dictionary-filter.service';
import { ActiveFilterPillsComponent } from './active-filter-pills.component';
import { LemmaFilterState } from './lemma-filter-state';

@Component({
  // Two instances sharing one state: one shows every filter, one hides the
  // saved-words-only pills (the Dictionary configuration).
  template: `
    <app-active-filter-pills />
    <app-active-filter-pills [showDates]="false" [showLatest]="false" />
  `,
  imports: [ActiveFilterPillsComponent],
})
class PillsHost {}

describe('ActiveFilterPillsComponent', () => {
  const UNIVERSE = ['masculine', 'nominative', 'present', 'past'];

  let fixture: ReturnType<typeof TestBed.createComponent<PillsHost>>;
  let root: HTMLElement;
  let service: DictionaryFilterService;

  const removeLabels = (bar: Element): string[] =>
    Array.from(
      bar.querySelectorAll<HTMLButtonElement>('button[aria-label^="Remove filter: "]'),
    ).map((button) => button.getAttribute('aria-label')!);

  beforeEach(async () => {
    const lexiconServiceMock = {
      lexiconFeaturesGet: vi.fn(() => of({ features: UNIVERSE })),
      lexiconQueryGet: vi.fn(() => of({ items: [], offset: 0, limit: 20, total: 0 })),
    };

    await TestBed.configureTestingModule({
      imports: [PillsHost],
      providers: [
        DictionaryFilterService,
        { provide: LemmaFilterState, useExisting: DictionaryFilterService },
        { provide: LexiconEndpointsService, useValue: lexiconServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PillsHost);
    service = TestBed.inject(DictionaryFilterService);
    root = fixture.nativeElement as HTMLElement;
  });

  const setEveryFilter = (): void => {
    service.lemmaSearch.set('λόγος');
    service.formSearch.set('λόγου');
    service.exampleSearch.set('sky');
    service.setPartOfSpeech('verb');
    service.toggleFeature('present');
    service.minDate.set(new Date('2026-11-01T00:00:00Z'));
    service.maxDate.set(new Date('2026-11-30T00:00:00Z'));
    service.latest.set(true);
    TestBed.tick();
  };

  it('renders one removable pill per active filter, with saved-only pills gated', () => {
    setEveryFilter();
    fixture.detectChanges();

    const bars = root.querySelectorAll('[aria-label="Active filters"]');
    expect(bars.length).toBe(2);

    const all = removeLabels(bars[0]);
    expect(all).toHaveLength(8);
    expect(all).toContain('Remove filter: Lemma: "λόγος"');
    expect(all).toContain('Remove filter: Form: "λόγου"');
    expect(all).toContain('Remove filter: Verb');
    expect(all).toContain('Remove filter: Present');
    expect(all).toContain('Remove filter: Context: "sky"');
    expect(all).toContain('Remove filter: Latest only');
    expect(all.some((label) => label.startsWith('Remove filter: From:'))).toBe(true);
    expect(all.some((label) => label.startsWith('Remove filter: To:'))).toBe(true);

    const dictionary = removeLabels(bars[1]);
    expect(dictionary).toHaveLength(5);
    expect(dictionary).not.toContain('Remove filter: Latest only');
    expect(dictionary.some((label) => label.startsWith('Remove filter: From:'))).toBe(false);
    expect(dictionary.some((label) => label.startsWith('Remove filter: To:'))).toBe(false);
  });

  it('removes only the clicked filter and updates the bar', () => {
    setEveryFilter();
    fixture.detectChanges();

    const bar = root.querySelector('[aria-label="Active filters"]')!;
    const lemmaButton = Array.from(bar.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.getAttribute('aria-label') === 'Remove filter: Lemma: "λόγος"',
    );
    lemmaButton?.click();
    fixture.detectChanges();

    expect(service.lemmaSearch()).toBe('');
    expect(service.formSearch()).toBe('λόγου');
    expect(removeLabels(root.querySelector('[aria-label="Active filters"]')!)).toHaveLength(7);
  });

  it('clears every filter with one button', () => {
    setEveryFilter();
    fixture.detectChanges();

    const clearButton = root.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear all active filters"]',
    );
    expect(clearButton).toBeTruthy();
    clearButton?.click();
    fixture.detectChanges();

    expect(service.hasActiveFilters()).toBe(false);
    expect(root.querySelector('[aria-label="Active filters"]')).toBeNull();
  });

  it('is announced politely by screen readers', () => {
    setEveryFilter();
    fixture.detectChanges();

    const bar = root.querySelector('[role="status"]')!;
    expect(bar.getAttribute('aria-live')).toBe('polite');
    expect(bar.getAttribute('aria-label')).toBe('Active filters');
  });
});
