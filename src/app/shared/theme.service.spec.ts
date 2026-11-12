import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

type SystemThemeListener = (event: MediaQueryListEvent) => void;

interface MatchMediaMock {
  setMatches(matches: boolean): void;
}

function installMatchMedia(initialMatches: boolean): MatchMediaMock {
  const listeners = new Set<SystemThemeListener>();
  const mediaQuery = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: SystemThemeListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: SystemThemeListener) => {
      listeners.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery));

  return {
    setMatches(matches: boolean) {
      (mediaQuery as { matches: boolean }).matches = matches;
      const event = { matches, media: mediaQuery.media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function resetDocumentTheme(): void {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = '';
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDocumentTheme();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    resetDocumentTheme();
  });

  it('should default to the system preference', () => {
    installMatchMedia(false);

    const service = TestBed.inject(ThemeService);

    expect(service.preference()).toBe('system');
    expect(service.isDark()).toBe(false);
  });

  it('should resolve the system preference from prefers-color-scheme', () => {
    installMatchMedia(true);

    const service = TestBed.inject(ThemeService);

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('should use a stored preference over the system preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    installMatchMedia(true);

    const service = TestBed.inject(ThemeService);

    expect(service.preference()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should apply and persist an explicit preference', () => {
    installMatchMedia(false);
    const service = TestBed.inject(ThemeService);

    service.setPreference('dark');

    expect(service.isDark()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');

    service.setPreference('light');

    expect(service.isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('should follow system changes while the preference is system', () => {
    const matchMedia = installMatchMedia(false);
    const service = TestBed.inject(ThemeService);

    matchMedia.setMatches(true);

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('should ignore system changes once an explicit preference is set', () => {
    const matchMedia = installMatchMedia(false);
    const service = TestBed.inject(ThemeService);

    service.setPreference('light');
    matchMedia.setMatches(true);

    expect(service.preference()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should return to following the system when system is selected', () => {
    const matchMedia = installMatchMedia(false);
    const service = TestBed.inject(ThemeService);

    service.setPreference('dark');
    service.setPreference('system');
    matchMedia.setMatches(true);

    expect(service.preference()).toBe('system');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('should not touch browser storage or the document during SSR', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    installMatchMedia(true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const service = TestBed.inject(ThemeService);

    expect(service.preference()).toBe('system');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    service.setPreference('dark');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
