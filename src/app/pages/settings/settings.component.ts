import { Component, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthEndpointsService } from '../../../api';
import { DeleteAccountConfirmationDialogComponent } from './delete-account-confirmation-dialog.component';

@Component({
  imports: [MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  selector: 'app-settings',
  styleUrl: './settings.component.css',
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthEndpointsService);
  private readonly dialog = inject(MatDialog);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  confirmAccountDeletion(): void {
    if (this.isLoading()) return;

    this.dialog
      .open(DeleteAccountConfirmationDialogComponent, {
        width: '28rem',
        maxWidth: 'calc(100vw - 2rem)',
        role: 'alertdialog',
        ariaLabelledBy: 'delete-account-dialog-title',
        ariaDescribedBy: 'delete-account-dialog-description',
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) this.deleteAccount();
      });
  }

  private deleteAccount(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService.authMeDelete().subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to delete account. Please try again later.');
      },
    });
  }
}
