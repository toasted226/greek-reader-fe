import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthEndpointsService } from '../../../../api';

@Component({
  selector: 'app-verify',
  imports: [MatProgressSpinnerModule, MatIconModule],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.css',
  host: {
    class: 'block w-full min-h-screen',
  },
})
export class VerifyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthEndpointsService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token || !token.trim()) {
      this.isLoading.set(false);
      this.errorMessage.set('Unable to verify your sign-in request. Please try again later.');
      return;
    }

    this.authService
      .authVerifyPost({ token: token.trim() }, 'body', { withCredentials: true })
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Unable to verify your sign-in request. Please try again later.');
        },
      });
  }
}
