import { Component, ElementRef, HostListener, inject, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';
import { InfoPanel } from '../../analysis/info-panel/info-panel';
import { Analysis } from '../../analysis/analysis';
import { AnalysisService } from '../../analysis/analysis.service';
import { FileUploadService } from '../../analysis/file-upload.service';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';
import { FileMetadataResponse, LexiconEndpointsService, UploadFileResponse } from '../../../api';
import { AuthService } from '../../auth/auth.service';
import { withCsrfProtection } from '../../auth/csrf.context';
import { formatBytes } from '../../shared/utils/file.utils';
import { ResizablePanelDirective } from '../../shared/directives/resizable-panel.directive';

export interface FileItem {
  id: number | string;
  displayName: string;
  originalFileName: string;
  fileSizeBytes: number;
  uploadedAt?: Date;
}

type FileAnalyserView = 'library' | 'analysis';


@Component({
  selector: 'app-file-analyser',
  imports: [
    CommonModule,
    MatIconModule,
    InfoPanel,
    Analysis,
    DatePipe,
    FileUploadComponent,
    ResizablePanelDirective,
  ],
  templateUrl: './file-analyser.component.html',
  styleUrl: './file-analyser.component.css',
  host: {
    class: 'flex flex-col flex-1 w-full h-full',
  },
})
export class FileAnalyserComponent implements OnInit {
  readonly analysisService = inject(AnalysisService);
  private readonly lexiconEndpointsService = inject(LexiconEndpointsService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly authService = inject(AuthService);

  // Page view is independent of the selected file so the library can be opened
  // without discarding the current document analysis.
  readonly view = signal<FileAnalyserView>('library');

  // File selection & upload state
  readonly selectedFile = signal<FileItem | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isUploading = signal<boolean>(false);

  // File list state
  readonly files = signal<FileItem[]>([]);
  readonly isLoadingFiles = signal<boolean>(false);
  readonly filesLoadError = signal<string | null>(null);

  // Per-file analysis loading state
  readonly isLoadingAnalysis = signal<boolean>(false);

  private readonly documentMenu = viewChild<ElementRef<HTMLDetailsElement>>('documentMenu');

  ngOnInit(): void {
    this.loadFiles();
  }

  private loadFiles(): void {
    this.isLoadingFiles.set(true);
    this.filesLoadError.set(null);

    this.lexiconEndpointsService.filesGet('body', { withCredentials: true }).subscribe({
      next: (response: FileMetadataResponse[]) => {
        this.files.set(response.map(this.mapToFileItem));
        this.isLoadingFiles.set(false);
      },
      error: () => {
        this.filesLoadError.set('Failed to load files. Please refresh to try again.');
        this.isLoadingFiles.set(false);
      },
    });
  }

  private mapToFileItem(f: FileMetadataResponse): FileItem {
    return {
      id: f.id ?? Date.now(),
      displayName: f.displayName ?? f.originalFileName ?? 'Untitled',
      originalFileName: f.originalFileName ?? '',
      fileSizeBytes: Number(f.fileSizeBytes ?? 0),
      uploadedAt: f.uploadedAt ? new Date(f.uploadedAt) : undefined,
    };
  }

  openLibrary(): void {
    this.view.set('library');
    this.closeDocumentMenu();
  }

  private closeDocumentMenu(): void {
    const menu = this.documentMenu()?.nativeElement;
    if (menu) menu.open = false;
  }

  selectFileFromMenu(file: FileItem): void {
    this.selectFile(file);
    this.closeDocumentMenu();
  }

  @HostListener('document:keydown.escape')
  closeDocumentMenuOnEscape(): void {
    this.closeDocumentMenu();
  }

  @HostListener('document:click', ['$event'])
  closeDocumentMenuOnOutsideClick(event: MouseEvent): void {
    const menu = this.documentMenu()?.nativeElement;
    if (menu && !menu.contains(event.target as Node)) menu.open = false;
  }

  selectFile(file: FileItem): void {
    this.view.set('analysis');
    this.selectedFile.set(file);
    this.errorMessage.set(null);
    this.isLoadingAnalysis.set(true);
    this.analysisService.clearAnalysis();

    this.lexiconEndpointsService
      .filesFileIdGet(Number(file.id), 'body', { withCredentials: true })
      .subscribe({
        next: (response: UploadFileResponse) => {
          const analysis = response.analysis ?? [];
          this.analysisService.tokens.set(analysis);
          const firstWord = analysis.find((item) => item.token.isWord);
          this.analysisService.selectedToken.set(firstWord ?? null);
          this.isLoadingAnalysis.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load analysis for this file. Please try again.');
          this.isLoadingAnalysis.set(false);
        },
      });
  }

  deselectFile(): void {
    this.selectedFile.set(null);
    this.analysisService.clearAnalysis();
    this.view.set('library');
  }

  onFileUploaded(file: File): void {
    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.fileUploadService
      .upload(file)
      .subscribe({
        next: (response: UploadFileResponse) => {
          this.isUploading.set(false);

          const uploadedFile: FileItem = {
            id: response.fileId ?? Date.now(),
            displayName: response.displayName ?? file.name,
            originalFileName: response.originalFileName ?? file.name,
            fileSizeBytes: Number(response.fileSizeBytes ?? file.size),
            uploadedAt: new Date(),
          };

          this.files.update((list) => [uploadedFile, ...list]);
          this.selectedFile.set(uploadedFile);
          this.view.set('analysis');

          const analysis = response.analysis ?? [];
          this.analysisService.tokens.set(analysis);
          const firstWord = analysis.find((item) => item.token.isWord);
          this.analysisService.selectedToken.set(firstWord ?? null);
        },
        error: (err) => {
          this.isUploading.set(false);
          let message = 'Failed to upload and analyse file. Please try again.';

          if (err?.status === 400) {
            message = 'The uploaded file is empty, corrupted, or contains unsupported characters. Please upload a valid UTF-8 plain text file.';
          } else if (err?.status === 401) {
            message = 'You must be signed in to upload files.';
          } else if (err?.status === 413) {
            message = err?.error?.code === 'user_text_storage_limit_exceeded'
              ? 'Your files have reached the 50 MiB total storage limit. Delete a file before uploading another.'
              : 'The uploaded file exceeds the per-file size limit.';
          } else if (err?.status === 409) {
            message = 'You have reached the 100 file limit. Delete a file before uploading another.';
          } else if (err?.status === 415) {
            message = 'Unsupported file format. Please upload a plain text (.txt, .text) file.';
          } else if (err?.status === 429) {
            message = 'Upload limit reached. Please wait a moment before trying again.';
          } else if (err?.status >= 500) {
            message = 'A server error occurred while processing the file. Please try again later.';
          }

          this.errorMessage.set(message);
        },
      });
  }

  onUploadError(error: string): void {
    this.errorMessage.set(error);
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  deleteFile(file: FileItem, event: Event): void {
    event.stopPropagation();

    this.authService
      .fetchCsrfToken(true)
      .pipe(
        switchMap(() =>
          this.lexiconEndpointsService.filesFileIdDelete(Number(file.id), 'body', {
            withCredentials: true,
            context: withCsrfProtection(),
          }),
        ),
      )
      .subscribe({
        next: () => {
          if (this.selectedFile()?.id === file.id) {
            this.deselectFile();
          }
          this.files.update((list) => list.filter((f) => f.id !== file.id));
          this.errorMessage.set(null);
        },
        error: () => {
          this.errorMessage.set('Failed to delete file. Please try again.');
        },
      });
  }

  readonly formatBytes = formatBytes;
}
