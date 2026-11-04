import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render dropzone and browse button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Upload your Greek text file');
    expect(compiled.textContent).toContain('Select file to upload');
    expect(compiled.textContent).toContain('Plain text (.txt, .text)');
    expect(compiled.textContent).toContain('Maximum size 1 MB');
  });

  it('should emit validationError when file exceeds maxFileBytes', () => {
    let emittedError = '';
    component.validationError.subscribe((err) => (emittedError = err));

    // File larger than 1 MB
    const largeFile = new File([new ArrayBuffer(1024 * 1024 + 10)], 'large.txt', {
      type: 'text/plain',
    });

    component.processFile(largeFile);
    expect(emittedError).toContain('File size exceeds');
  });

  it('should emit validationError when file has unsupported extension', () => {
    let emittedError = '';
    component.validationError.subscribe((err) => (emittedError = err));

    const invalidFile = new File(['content'], 'document.pdf', {
      type: 'application/pdf',
    });

    component.processFile(invalidFile);
    expect(emittedError).toContain('Unsupported file format');
  });

  it('should emit fileSelected when a valid plain text file is processed', () => {
    let selectedFile: File | null = null;
    component.fileSelected.subscribe((file) => (selectedFile = file));

    const validFile = new File(['λόγος'], 'sample.txt', { type: 'text/plain' });
    component.processFile(validFile);

    expect(selectedFile).toBe(validFile);
  });

  it('should render error alert when errorMessage input is provided and emit errorCleared on dismiss', () => {
    fixture.componentRef.setInput('errorMessage', 'Failed to upload file.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Failed to upload file.');

    let cleared = false;
    component.errorCleared.subscribe(() => (cleared = true));

    const dismissBtn = compiled.querySelector('button[aria-label="Dismiss error"]') as HTMLButtonElement;
    dismissBtn.click();

    expect(cleared).toBe(true);
  });
});
