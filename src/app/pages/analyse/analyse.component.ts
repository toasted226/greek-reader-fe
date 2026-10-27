import { Component, signal } from '@angular/core';
import { Analysis } from '../../analysis/analysis';
import { InfoPanel } from '../../analysis/info-panel/info-panel';

const DEFAULT_PANEL_WIDTH = 450;
const MIN_PANEL_WIDTH = 430;
const MAX_PANEL_WIDTH = 650;

@Component({
  selector: 'app-analyse',
  imports: [Analysis, InfoPanel],
  templateUrl: './analyse.component.html',
  styleUrl: './analyse.component.css',
  host: {
    class: 'flex flex-col flex-1 w-full',
  },
})
export class AnalyseComponent {
  readonly infoPanelWidth = signal<number>(DEFAULT_PANEL_WIDTH);
  readonly isDragging = signal<boolean>(false);

  private startX = 0;
  private startWidth = DEFAULT_PANEL_WIDTH;

  onResizeStart(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.startX = event.clientX;
    this.startWidth = this.infoPanelWidth();
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
      Math.max(this.startWidth + deltaX, MIN_PANEL_WIDTH),
      MAX_PANEL_WIDTH,
    );
    this.infoPanelWidth.set(newWidth);
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
      this.infoPanelWidth.update((w) => Math.min(w + 10, MAX_PANEL_WIDTH));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.infoPanelWidth.update((w) => Math.max(w - 10, MIN_PANEL_WIDTH));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.infoPanelWidth.set(DEFAULT_PANEL_WIDTH);
    }
  }
}
