import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { FileAnalyserComponent, FileItem } from './file-analyser.component';
import { BASE_PATH_DEFAULT, LexiconEndpointsService, UploadFileResponse } from '../../../api';
import { AuthService } from '../../auth/auth.service';

describe('FileAnalyserComponent', () => {
  let component: FileAnalyserComponent;
  let fixture: ComponentFixture<FileAnalyserComponent>;
  let lexiconService: LexiconEndpointsService;
  let authServiceMock: { fetchCsrfToken: ReturnType<typeof vi.fn> };

  const analysisResponse: UploadFileResponse = {
    analysis: [
      {
        token: { text: 'λόγος', isWord: true, start: 0 },
        lemmas: [
          {
            id: 1,
            lemma: 'λόγος',
            pos: 'Noun',
            glosses: ['word', 'reason'],
            forms: [{ form: 'λόγος', features: ['nom', 'masc', 'sg'] }],
            examples: [],
          },
        ],
      },
    ],
  };

  const testFile: FileItem = {
    id: 7,
    displayName: 'Test Document',
    originalFileName: 'test.txt',
    fileSizeBytes: 100,
    uploadedAt: new Date('2025-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    authServiceMock = {
      fetchCsrfToken: vi.fn().mockReturnValue(of('mock-csrf-token')),
    };

    await TestBed.configureTestingModule({
      imports: [FileAnalyserComponent],
      providers: [
        provideHttpClient(),
        { provide: BASE_PATH_DEFAULT, useValue: 'http://localhost:3000' },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    lexiconService = TestBed.inject(LexiconEndpointsService);
    vi.spyOn(lexiconService, 'filesGet').mockReturnValue(of([]) as any);

    fixture = TestBed.createComponent(FileAnalyserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with an empty file list and show the library view', () => {
    expect(component).toBeTruthy();
    expect(component.files()).toEqual([]);
    expect(component.view()).toBe('library');
  });

  it('should render the compact upload row above the files list', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('File Analyser');
    expect(compiled.textContent).toContain('Upload File');
    expect(compiled.textContent).toContain('Choose a file to analyse, or drag it here.');
    expect(compiled.textContent).toContain('Plain text (.txt, .text)');
    expect(compiled.textContent).toContain('up to 1 MB');
    expect(compiled.textContent).toContain('Your Files');
    expect(compiled.textContent).toContain('No files uploaded yet.');
    expect(compiled.querySelector('app-analysis')).toBeFalsy();
    expect(compiled.querySelector('app-info-panel')).toBeFalsy();
    expect(compiled.querySelector('aside')).toBeFalsy();
  });

  it('should show loading and file load error states in the library list', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    component.isLoadingFiles.set(true);
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Loading files');

    component.isLoadingFiles.set(false);
    component.filesLoadError.set('Could not reach the file service.');
    fixture.detectChanges();
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('Could not reach the file service.');
  });

  it('should show and clear upload errors', () => {
    component.errorMessage.set('File size exceeds 1 MB limit (1.5 MB).');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('File upload issue');
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('File size exceeds 1 MB limit (1.5 MB).');

    component.clearError();
    fixture.detectChanges();
    expect(compiled.querySelector('[role="alert"]')).toBeFalsy();
  });

  it('should open a selected file analysis from the library list', () => {
    component.files.set([testFile]);
    vi.spyOn(lexiconService, 'filesFileIdGet').mockReturnValue(of(analysisResponse) as any);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const fileButton = Array.from(compiled.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Test Document'),
    );
    expect(fileButton).toBeTruthy();
    fileButton?.click();
    fixture.detectChanges();

    expect(component.view()).toBe('analysis');
    expect(component.selectedFile()).toEqual(testFile);
    expect(component.analysisService.selectedToken()?.token.text).toBe('λόγος');
    expect(compiled.querySelector('app-analysis')).toBeTruthy();
    expect(compiled.querySelector('app-info-panel')).toBeTruthy();
    expect(compiled.querySelector('app-file-upload')).toBeFalsy();
    expect(compiled.textContent).toContain('Inflected');
    expect(compiled.textContent).toContain('Coverage');
  });

  it('should use the document dropdown to return to the library without clearing the analysis', () => {
    component.files.set([testFile]);
    vi.spyOn(lexiconService, 'filesFileIdGet').mockReturnValue(of(analysisResponse) as any);
    component.selectFile(testFile);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const documentMenu = compiled.querySelector('details') as HTMLDetailsElement;
    documentMenu.open = true;
    fixture.detectChanges();

    const uploadButton = Array.from(documentMenu.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Upload File'),
    );
    expect(uploadButton).toBeTruthy();
    uploadButton?.click();
    fixture.detectChanges();

    expect(component.view()).toBe('library');
    expect(component.selectedFile()).toEqual(testFile);
    expect(component.analysisService.tokens()).toEqual(analysisResponse.analysis);
    expect(compiled.querySelector('app-analysis')).toBeFalsy();
    expect(compiled.querySelector('app-info-panel')).toBeFalsy();
    expect(compiled.querySelector('app-file-upload')).toBeTruthy();
    expect(compiled.textContent).toContain('Your Files');
  });

  it('should restore the accessible info panel resize divider in analysis view', () => {
    vi.spyOn(lexiconService, 'filesFileIdGet').mockReturnValue(of(analysisResponse) as any);
    component.selectFile(testFile);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const divider = compiled.querySelector('[role="separator"]') as HTMLElement;
    expect(divider).toBeTruthy();
    expect(divider.getAttribute('aria-valuenow')).toBe('450');

    divider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(divider.getAttribute('aria-valuenow')).toBe('460');
  });

  it('should upload a file and immediately show its analysis', () => {
    const file = new File(['λόγος'], 'sample.txt', { type: 'text/plain' });
    const response: UploadFileResponse = {
      ...analysisResponse,
      fileId: 42,
      displayName: 'Sample Document',
      originalFileName: 'sample.txt',
      fileSizeBytes: 5,
      characterCount: 5,
    };
    vi.spyOn(lexiconService, 'filesPost').mockReturnValue(of(response) as any);

    component.onFileUploaded(file);
    fixture.detectChanges();

    expect(authServiceMock.fetchCsrfToken).toHaveBeenCalledWith(true);
    expect(lexiconService.filesPost).toHaveBeenCalledWith(
      file,
      'body',
      expect.objectContaining({ withCredentials: true }),
    );
    expect(component.view()).toBe('analysis');
    expect(component.files()).toHaveLength(1);
    expect(component.selectedFile()?.displayName).toBe('Sample Document');
    expect(component.analysisService.tokens()).toEqual(response.analysis);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="token-container"]')).toBeTruthy();
    expect(compiled.querySelector('app-info-panel')).toBeTruthy();
  });

  it('should keep the library visible and show a friendly error when upload fails', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    vi.spyOn(lexiconService, 'filesPost').mockReturnValue(
      throwError(() => ({ status: 413, message: 'Payload Too Large' })) as any,
    );

    component.onFileUploaded(file);
    fixture.detectChanges();

    expect(component.isUploading()).toBe(false);
    expect(component.view()).toBe('library');
    expect(component.errorMessage()).toBe('File size exceeds the 1 MB limit.');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-file-upload')).toBeTruthy();
  });

  it('should delete a file from the library list', () => {
    component.files.set([testFile]);
    vi.spyOn(lexiconService, 'filesFileIdDelete').mockReturnValue(of({}) as any);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButton = compiled.querySelector('button[aria-label="Delete Test Document"]') as HTMLButtonElement;
    expect(deleteButton).toBeTruthy();
    deleteButton.click();
    fixture.detectChanges();

    expect(lexiconService.filesFileIdDelete).toHaveBeenCalledWith(
      7,
      'body',
      expect.objectContaining({ withCredentials: true }),
    );
    expect(component.files()).toEqual([]);
    expect(compiled.textContent).toContain('No files uploaded yet.');
  });
});
