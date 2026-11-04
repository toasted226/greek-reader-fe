import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { formatBytes } from '../../shared/utils/file.utils';

@Component({
  selector: 'app-file-upload',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css',
  host: {
    class: 'block w-full',
  },
})
export class FileUploadComponent {
  readonly errorMessage = input<string | null>(null);
  readonly isUploading = input<boolean>(false);
  readonly compact = input<boolean>(false);
  readonly maxFileBytes = input<number>(1024 * 1024); // 1 MB default
  readonly acceptedExtensions = input<string[]>([".txt", ".text"]);

  readonly fileSelected = output<File>();
  readonly validationError = output<string>();
  readonly errorCleared = output<void>();

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly isDragOver = signal<boolean>(false);

  openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.processFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  processFile(file: File): void {
    // Validate file size
    if (file.size > this.maxFileBytes()) {
      this.validationError.emit(
        `File size exceeds ${this.formatBytes(this.maxFileBytes())} limit (${this.formatBytes(file.size)}).`
      );
      return;
    }

    // Validate file extension
    const name = file.name.toLowerCase();
    const hasAllowedExt = this.acceptedExtensions().some((ext) =>
      name.endsWith(ext.toLowerCase())
    );

    if (!hasAllowedExt) {
      this.validationError.emit(
        `Unsupported file format. Please upload a plain text (${this.acceptedExtensions().join(', ')}) file.`
      );
      return;
    }

    this.fileSelected.emit(file);
  }

  clearError(): void {
    this.errorCleared.emit();
  }

  readonly formatBytes = formatBytes;
}
