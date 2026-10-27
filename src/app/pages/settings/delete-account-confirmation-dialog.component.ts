import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-delete-account-confirmation-dialog',
  imports: [MatDialogModule, MatIconModule],
  templateUrl: './delete-account-confirmation-dialog.component.html',
})
export class DeleteAccountConfirmationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DeleteAccountConfirmationDialogComponent>);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
