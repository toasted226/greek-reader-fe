import {
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'greek-reader-theme';
export const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mediaQuery = this.getMediaQuery();

  private readonly preferenceSignal = signal<ThemePreference>(this.readInitialPreference());
  private readonly systemPrefersDark = signal(this.mediaQuery?.matches ?? false);

  /** The user's stored choice. `system` follows the OS preference. */
  readonly preference = this.preferenceSignal.asReadonly();

  /** Resolved theme for the current preference and system state. */
  readonly isDark = computed(() => {
    const preference = this.preferenceSignal();
    return preference === 'system' ? this.systemPrefersDark() : preference === 'dark';
  });

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    this.applyTheme(this.isDark());

    if (!this.mediaQuery) {
      return;
    }

    const onSystemChange = (event: MediaQueryListEvent) => {
      this.systemPrefersDark.set(event.matches);

      if (this.preferenceSignal() === 'system') {
        this.applyTheme(this.isDark());
      }
    };

    this.mediaQuery.addEventListener('change', onSystemChange);
    this.destroyRef.onDestroy(() => {
      this.mediaQuery?.removeEventListener('change', onSystemChange);
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceSignal.set(preference);
    this.persist(preference);
    this.applyTheme(this.isDark());
  }

  private getMediaQuery(): MediaQueryList | null {
    if (!this.isBrowser || typeof window === 'undefined' || !window.matchMedia) {
      return null;
    }

    return window.matchMedia(DARK_MODE_QUERY);
  }

  private readInitialPreference(): ThemePreference {
    if (!this.isBrowser) {
      return 'system';
    }

    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'system' || stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // Storage can be unavailable (private mode, blocked cookies). Fall back
      // to the system preference.
    }

    return 'system';
  }

  private persist(preference: ThemePreference): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Persistence is best-effort; the in-memory preference still applies.
    }
  }

  private applyTheme(isDark: boolean): void {
    if (!this.isBrowser) {
      return;
    }

    const root = this.document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }
}
