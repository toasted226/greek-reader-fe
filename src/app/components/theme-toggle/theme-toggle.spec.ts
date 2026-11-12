import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { ThemeToggle } from './theme-toggle';
import { THEME_STORAGE_KEY, ThemeService } from '../../shared/theme.service';

function resetDocumentTheme(): void {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = '';
}

describe('ThemeToggle', () => {
  let service: ThemeService;

  beforeEach(async () => {
    localStorage.clear();
    resetDocumentTheme();

    await TestBed.configureTestingModule({
      imports: [ThemeToggle],
    }).compileComponents();

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    resetDocumentTheme();
  });

  it('should show the system preference by default', () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const icon = button.querySelector('mat-icon');

    expect(button.getAttribute('aria-label')).toBe('Theme: System (light)');
    expect(icon?.textContent?.trim()).toBe('brightness_auto');
  });

  it('should expose all three preferences', () => {
    const fixture = TestBed.createComponent(ThemeToggle);

    expect(fixture.componentInstance.options.map((option) => option.value)).toEqual([
      'system',
      'light',
      'dark',
    ]);
  });

  it('should open a menu with the three theme options', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const items = Array.from(overlay.querySelectorAll<HTMLElement>('.mat-mdc-menu-item'));

    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain('System');
    expect(items[1].textContent).toContain('Light');
    expect(items[2].textContent).toContain('Dark');
    expect(items[0].querySelectorAll('mat-icon')).toHaveLength(2);
    expect(items[1].querySelectorAll('mat-icon')).toHaveLength(1);
    expect(items[0].getAttribute('role')).toBe('menuitemradio');
    expect(items[0].getAttribute('aria-checked')).toBe('true');
    expect(items[1].getAttribute('aria-checked')).toBe('false');
  });

  it('should switch to an explicit dark preference', () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();

    fixture.componentInstance.select('dark');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const icon = button.querySelector('mat-icon');

    expect(service.preference()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Theme: Dark');
    expect(icon?.textContent?.trim()).toBe('dark_mode');
  });

  it('should return to the system preference', () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();

    fixture.componentInstance.select('dark');
    fixture.componentInstance.select('system');
    fixture.detectChanges();

    expect(service.preference()).toBe('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
