import { Component, inject, signal } from '@angular/core';
import { AuthEndpointsService } from '../../../api';
import { Router } from '@angular/router';

@Component({
  imports: [],
  selector: 'app-settings',
  styleUrl: './settings.component.css',
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthEndpointsService);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  deleteAccount(): void {
    this.isLoading.set(true);

    this.authService.authMeDelete().subscribe({
      next: data => {
        this.isLoading.set(false);
        this.router.navigate(["/auth/login"]);
      },
      error: err => {
        this.errorMessage.set("Failed to delete account. Please try again later.");
      }
    });
  }
}
