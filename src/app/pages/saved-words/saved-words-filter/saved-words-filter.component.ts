import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { POS_LABELS, POS_VALUES } from '../../../analysis/filter-features';
import { SavedWordsFilterService } from '../saved-words-filter.service';

@Component({
  selector: 'app-saved-words-filter',
  imports: [FormsModule, NgClass],
  templateUrl: './saved-words-filter.component.html',
  host: {
    class: 'block',
  },
})
export class SavedWordsFilterComponent {
  protected readonly filterService = inject(SavedWordsFilterService);

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
