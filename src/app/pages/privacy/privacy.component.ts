import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css',
  host: {
    class: 'block w-full min-h-screen bg-surface-page',
  },
})
export class PrivacyComponent {}
