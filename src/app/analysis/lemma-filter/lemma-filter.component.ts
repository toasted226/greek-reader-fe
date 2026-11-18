import { NgClass } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { POS_LABELS, POS_VALUES } from '../filter-features';
import { LemmaFilterState } from './lemma-filter-state';

/** Monotonic per-instance counter backing `LemmaFilterComponent.uid`. */
let nextFilterUid = 0;

@Component({
  selector: 'app-lemma-filter',
  imports: [FormsModule, NgClass],
  templateUrl: './lemma-filter.component.html',
  host: {
    class: 'block',
  },
})
export class LemmaFilterComponent {
  /**
   * Whether the saved-on date range is shown. Dates are a per-user
   * saved-words concept; the global lexicon endpoint has no equivalent.
   */
  readonly showDates = input(true);

  /**
   * Whether the "Latest" toggle is shown. `latest` applies to saved words
   * only — it does not exist as a global lexicon filter.
   */
  readonly showLatest = input(true);

  /** Label above the example/context search input. */
  readonly exampleLabel = input('Context sentence');

  /** Placeholder inside the example/context search input. */
  readonly examplePlaceholder = input('Search within saved context sentences…');

  protected readonly filterService = inject(LemmaFilterState);

  /**
   * Per-instance prefix for generated DOM ids, so two instances of this
   * component on one page never produce duplicate ids (which would break
   * `<label for>` and `aria-controls`).
   */
  protected readonly uid = `lemma-filter-${nextFilterUid++}`;

  /** Unique DOM id for a named field within this instance. */
  protected fieldId(field: string): string {
    return `${this.uid}-${field}`;
  }

  protected readonly posValues = POS_VALUES;
  protected readonly posLabels = POS_LABELS;

  /** Controls the "More filters" disclosure section. */
  protected readonly showMore = signal(false);

  // ── Primary row handlers ─────────────────────────────────────────────────

  onLemmaInput(value: string): void {
    this.filterService.lemmaInput$.next(value);
  }

  onFormInput(value: string): void {
    this.filterService.formInput$.next(value);
  }

  onPosChange(value: string): void {
    this.filterService.setPartOfSpeech(value || null);
  }

  onLatestChange(value: boolean): void {
    this.filterService.latest.set(value);
  }

  // ── Secondary row handlers ───────────────────────────────────────────────

  onExampleInput(value: string): void {
    this.filterService.exampleInput$.next(value);
  }

  onMinDateChange(value: string): void {
    this.filterService.minDate.set(value ? new Date(value) : null);
  }

  onMaxDateChange(value: string): void {
    this.filterService.maxDate.set(value ? new Date(value) : null);
  }

  onFeatureToggle(key: string, enabled: boolean): void {
    if (!enabled) return;
    this.filterService.toggleFeature(key);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Returns the NgClass object for a feature chip button.
   * All class strings are written as literals here so Tailwind JIT can scan
   * them at build time — dynamic `[class.hover:*]` bindings are not scanned.
   */
  featureChipClasses(key: string, enabled: boolean): Record<string, boolean> {
    const selected = this.filterService.selectedFeatures().includes(key) && enabled;
    return {
      // Active (selected + enabled)
      'border-brand-primary': selected,
      'bg-brand-primary': selected,
      'text-text-on-brand': selected,
      // Inactive enabled
      'border-border-default': !selected,
      'bg-surface-page': !selected,
      'text-text-secondary': !selected,
      'hover:bg-brand-soft': !selected && enabled,
      'hover:border-brand-primary': !selected && enabled,
      'hover:text-brand-primary': !selected && enabled,
      // Disabled
      'opacity-40': !enabled,
      'cursor-not-allowed': !enabled,
      'cursor-pointer': enabled,
    };
  }

  /** Returns the ISO date string (YYYY-MM-DD) for a Date signal value,
   *  or empty string — suitable for binding to <input type="date">. */
  dateToInputValue(date: Date | null): string {
    if (!date) return '';
    return date.toISOString().slice(0, 10);
  }
}
