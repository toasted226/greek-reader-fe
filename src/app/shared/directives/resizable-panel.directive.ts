import { Directive, input, signal } from '@angular/core';

@Directive({
  selector: '[appResizablePanel]',
  exportAs: 'appResizablePanel',
})
export class ResizablePanelDirective {
  readonly defaultWidth = input<number>(450);
  readonly minWidth = input<number>(430);
  readonly maxWidth = input<number>(650);

  readonly panelWidth = signal<number>(this.defaultWidth());
  readonly isDragging = signal<boolean>(false);

  private startX = 0;
  private startWidth = 0;

  onResizeStart(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.startX = event.clientX;
    this.startWidth = this.panelWidth();
    this.isDragging.set(true);

    const target = event.currentTarget as HTMLElement;
    if (target?.setPointerCapture) {
      try {
        target.setPointerCapture(event.pointerId);
      } catch {}
    }
  }

  onResizeMove(event: PointerEvent): void {
    if (!this.isDragging()) return;
    const deltaX = this.startX - event.clientX;
    const newWidth = Math.min(
      Math.max(this.startWidth + deltaX, this.minWidth()),
      this.maxWidth(),
    );
    this.panelWidth.set(newWidth);
  }

  onResizeEnd(event: PointerEvent): void {
    if (!this.isDragging()) return;
    this.isDragging.set(false);

    const target = event.currentTarget as HTMLElement;
    if (target?.releasePointerCapture) {
      try {
        target.releasePointerCapture(event.pointerId);
      } catch {}
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.panelWidth.update((w) => Math.min(w + 10, this.maxWidth()));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.panelWidth.update((w) => Math.max(w - 10, this.minWidth()));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.panelWidth.set(this.defaultWidth());
    }
  }
}
