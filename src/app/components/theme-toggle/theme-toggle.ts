import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ThemePreference, ThemeService } from '../../shared/theme.service';

interface ThemeOption {
  value: ThemePreference;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-theme-toggle',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './theme-toggle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
  },
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);

  readonly preference = this.themeService.preference;
  readonly isDark = this.themeService.isDark;

  readonly options: readonly ThemeOption[] = [
    { value: 'system', label: 'System', icon: 'brightness_auto' },
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  ];

  readonly activeLabel = computed(() => {
    const active = this.options.find((option) => option.value === this.preference());

    if (active?.value === 'system') {
      return `System (${this.isDark() ? 'dark' : 'light'})`;
    }

    return active?.label ?? 'System';
  });

  readonly triggerIcon = computed(() => {
    switch (this.preference()) {
      case 'dark':
        return 'dark_mode';
      case 'light':
        return 'light_mode';
      default:
        return 'brightness_auto';
    }
  });

  select(preference: ThemePreference): void {
    this.themeService.setPreference(preference);
  }
}
