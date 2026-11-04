import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { BASE_PATH_DEFAULT, UploadFileResponse } from '../../api';
import { AuthService } from '../auth/auth.service';
import { CSRF_PROTECTED } from '../auth/csrf.context';
import { FileUploadService } from './file-upload.service';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let httpMock: HttpTestingController;
  let authServiceMock: { fetchCsrfToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceMock = {
      fetchCsrfToken: vi.fn().mockReturnValue(of('csrf-token')),
    };

    TestBed.configureTestingModule({
      providers: [
        FileUploadService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BASE_PATH_DEFAULT, useValue: 'http://localhost:3000' },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(FileUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should upload a file with credentials and CSRF protection enabled', () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const response: UploadFileResponse = { originalFileName: 'hello.txt', characterCount: 5 };
    let result: UploadFileResponse | undefined;

    service.upload(file).subscribe((value) => {
      result = value;
    });

    const req = httpMock.expectOne('http://localhost:3000/files');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.context.get(CSRF_PROTECTED)).toBe(true);
    expect(req.request.body).toBeInstanceOf(FormData);
    expect((req.request.body as FormData).get('file')).toBe(file);

    req.flush(response);

    expect(authServiceMock.fetchCsrfToken).toHaveBeenCalledWith(true);
    expect(result).toEqual(response);
  });

  it('should not upload when the CSRF token cannot be fetched', () => {
    authServiceMock.fetchCsrfToken.mockReturnValue(
      throwError(() => new Error('CSRF failed')),
    );

    let errored = false;
    service.upload(new File(['hello'], 'hello.txt')).subscribe({
      error: () => {
        errored = true;
      },
    });

    httpMock.expectNone('http://localhost:3000/files');
    expect(errored).toBe(true);
  });
});
