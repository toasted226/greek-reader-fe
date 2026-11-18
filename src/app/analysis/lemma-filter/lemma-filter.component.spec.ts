import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { of } from 'rxjs';
import { LexiconEndpointsService } from '../../../api';
import { LemmaFilterComponent } from './lemma-filter.component';
import { LemmaFilterState } from './lemma-filter-state';
import { DictionaryFilterService } from '../../pages/dictionary/dictionary-filter.service';

@Component({
  // Two instances on one "page": they share one state service, but every DOM
  // id must still be unique per component instance.
  template: '<app-lemma-filter /><app-lemma-filter />',
  imports: [LemmaFilterComponent],
  providers: [
    DictionaryFilterService,
    { provide: LemmaFilterState, useExisting: DictionaryFilterService },
  ],
})
class TwoInstanceHost {}

describe('LemmaFilterComponent — generated DOM ids', () => {
  beforeEach(async () => {
    const lexiconServiceMock = {
      lexiconQueryGet: vi.fn().mockReturnValue(of({ items: [], offset: 0, limit: 20, total: 0 })),
      lexiconFeaturesGet: vi.fn().mockReturnValue(of({ features: [] })),
      lemmasGet: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [TwoInstanceHost],
      providers: [{ provide: LexiconEndpointsService, useValue: lexiconServiceMock }],
    }).compileComponents();
  });

  it('gives every field a unique id per instance, with labels and aria-controls matching', () => {
    const fixture = TestBed.createComponent(TwoInstanceHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    // Every element id in the host is unique, including ids generated while
    // both "More filters" sections are collapsed (lemma, form, pos).
    const allIds = Array.from(root.querySelectorAll('[id]')).map((el) => el.id);
    expect(allIds.length).toBeGreaterThan(0);
    expect(new Set(allIds).size).toBe(allIds.length);

    // Every label points at an element that exists (all primary fields render).
    for (const label of Array.from(root.querySelectorAll('label[for]'))) {
      expect(root.querySelector(`#${CSS.escape(label.getAttribute('for')!)}`)).toBeTruthy();
    }
  });

  it('keeps ids unique when both "More filters" sections are expanded', () => {
    const fixture = TestBed.createComponent(TwoInstanceHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>('[aria-controls]'))) {
      button.click();
    }
    fixture.detectChanges();

    // Date range, feature chips and example search are now rendered twice.
    const exampleIds = Array.from(root.querySelectorAll('[id$="-example"]')).map((el) => el.id);
    expect(exampleIds.length).toBe(2);
    expect(new Set(exampleIds).size).toBe(2);

    const allIds = Array.from(root.querySelectorAll('[id]')).map((el) => el.id);
    expect(new Set(allIds).size).toBe(allIds.length);

    // Every label and aria-controls reference points at an element that exists.
    for (const label of Array.from(root.querySelectorAll('label[for]'))) {
      expect(root.querySelector(`#${CSS.escape(label.getAttribute('for')!)}`)).toBeTruthy();
    }
    for (const button of Array.from(root.querySelectorAll('[aria-controls]'))) {
      expect(
        root.querySelector(`#${CSS.escape(button.getAttribute('aria-controls')!)}`),
      ).toBeTruthy();
    }
  });

  it('expands one instance without opening the other', () => {
    const fixture = TestBed.createComponent(TwoInstanceHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const buttons = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[aria-controls$="-more"]'),
    );
    expect(buttons.length).toBe(2);

    buttons[0].click();
    fixture.detectChanges();

    // `showMore` is component-local state, so only the clicked section opens.
    expect(root.querySelectorAll('[id$="-more"]').length).toBe(1);
  });
});
