import { Component, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthEndpointsService } from '../../../../api';

@Component({
  selector: 'app-login',
  imports: [MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  host: {
    class: 'block w-full min-h-screen',
  },
})
export class LoginComponent {
  private readonly authService = inject(AuthEndpointsService);

  readonly email = signal('');
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  signIn(): void {
    const emailValue = this.email().trim();
    if (!emailValue || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService
      .authRequestPost({ email: emailValue })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set(
            'We sent a verification link to your email. Please check your inbox to sign in.',
          );
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set(
            'Unable to process your sign-in request. Please try again later.',
          );
        },
      });
  }
}
