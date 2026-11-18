import type { ComponentFixture } from '@angular/core/testing';

/**
 * Returns the Examples disclosure toggle rendered by `app-lemma-item`.
 * Throws rather than returning null so a missing toggle fails clearly.
 */
export function getExamplesToggle(root: ParentNode): HTMLButtonElement {
  const toggle = root.querySelector<HTMLButtonElement>('button[aria-controls="examples-list"]');
  if (!toggle) {
    throw new Error('Examples disclosure toggle not found');
  }
  return toggle;
}

/**
 * Expands the collapsed Examples disclosure in a rendered `app-lemma-item`
 * and returns its toggle so callers can assert the expanded state and content.
 */
export function expandExamples(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  const toggle = getExamplesToggle(fixture.nativeElement as HTMLElement);
  toggle.click();
  fixture.detectChanges();
  return toggle;
}
