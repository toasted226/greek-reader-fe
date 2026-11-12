import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/theme.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  host: {
    class: 'block h-full w-full',
  },
})
export class App {
  // Instantiate at app start so the theme is applied and the OS preference
  // listener stays active on routes that don't render the toggle.
  private readonly themeService = inject(ThemeService);

  protected readonly title = signal('greek-reader');
}
