import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ScrollToTop } from '../../components/scroll-to-top/scroll-to-top';
import { AuthEndpointsService } from '../../../api';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    ScrollToTop,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  host: {
    class: 'block h-full w-full',
  },
})
export class DashboardComponent {
  private readonly authEndpointsService = inject(AuthEndpointsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSigningOut = signal(false);
  readonly signOutError = signal<string | null>(null);

  signOut(): void {
    if (this.isSigningOut()) {
      return;
    }

    this.isSigningOut.set(true);
    this.signOutError.set(null);

    this.authEndpointsService.authLogoutPost('body', { withCredentials: true }).subscribe({
      next: () => {
        this.authService.clearAuth();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.isSigningOut.set(false);
        this.signOutError.set('Could not sign out. Please try again later.');
      },
    });
  }
}
