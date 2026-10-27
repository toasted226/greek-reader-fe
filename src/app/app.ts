import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
  protected readonly title = signal('greek-reader');
}
