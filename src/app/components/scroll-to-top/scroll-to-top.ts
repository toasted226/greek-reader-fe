import {
  Component,
  inject,
  input,
  PLATFORM_ID,
  signal,
  AfterViewInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-scroll-to-top',
  imports: [MatIconModule],
  templateUrl: './scroll-to-top.html',
})
export class ScrollToTop implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly target = input<any>(null);
  readonly threshold = input<number>(200);

  readonly isVisible = signal<boolean>(false);

  private cleanUpTargetListener?: () => void;
  private cleanUpWindowListener?: () => void;

  constructor() {
    effect(() => {
      // Re-bind listeners when target changes
      const currentTarget = this.target();
      this.bindListeners();
    });
  }

  ngAfterViewInit(): void {
    this.bindListeners();
  }

  ngOnDestroy(): void {
    this.removeListeners();
  }

  private getTargetElement(): HTMLElement | null {
    const t = this.target();
    if (!t) return null;
    if (t instanceof HTMLElement) return t;
    if (typeof t.getElementRef === 'function') {
      return t.getElementRef().nativeElement;
    }
    if (t.nativeElement) {
      return t.nativeElement;
    }
    if (typeof t.scrollTo === 'function' || 'scrollTop' in t) {
      return t as HTMLElement;
    }
    return null;
  }

  private bindListeners(): void {
    if (!this.isBrowser) return;

    this.removeListeners();

    const element = this.getTargetElement();
    if (element) {
      const targetHandler = () => {
        this.checkScroll(element.scrollTop);
      };
      element.addEventListener('scroll', targetHandler, { passive: true });
      this.cleanUpTargetListener = () => {
        element.removeEventListener('scroll', targetHandler);
      };
      targetHandler();
    }

    const windowHandler = () => {
      const scrollY =
        window.scrollY ??
        document.documentElement.scrollTop ??
        document.body.scrollTop ??
        0;
      this.checkScroll(scrollY);
    };
    window.addEventListener('scroll', windowHandler, { passive: true });
    this.cleanUpWindowListener = () => {
      window.removeEventListener('scroll', windowHandler);
    };
  }

  private removeListeners(): void {
    if (this.cleanUpTargetListener) {
      this.cleanUpTargetListener();
      this.cleanUpTargetListener = undefined;
    }
    if (this.cleanUpWindowListener) {
      this.cleanUpWindowListener();
      this.cleanUpWindowListener = undefined;
    }
  }

  checkScroll(scrollTop?: number): void {
    if (!this.isBrowser) return;
    const targetEl = this.getTargetElement();
    const currentScroll =
      scrollTop ??
      targetEl?.scrollTop ??
      window.scrollY ??
      document.documentElement.scrollTop ??
      0;
    this.isVisible.set(currentScroll > this.threshold());
  }

  scrollToTop(): void {
    if (!this.isBrowser) return;
    const targetEl = this.getTargetElement();
    if (targetEl) {
      targetEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
