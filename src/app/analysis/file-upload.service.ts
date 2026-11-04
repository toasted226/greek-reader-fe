import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { BASE_PATH_DEFAULT, UploadFileResponse } from '../../api';
import { AuthService } from '../auth/auth.service';
import { withCsrfProtection } from '../auth/csrf.context';

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private readonly httpClient = inject(HttpClient);
  private readonly basePath = inject(BASE_PATH_DEFAULT);
  private readonly authService = inject(AuthService);

  upload(file: File): Observable<UploadFileResponse> {
    return this.authService.fetchCsrfToken(true).pipe(
      switchMap(() => {
        const formData = new FormData();
        formData.append('file', file);

        return this.httpClient.post<UploadFileResponse>(`${this.basePath}/files`, formData, {
          withCredentials: true,
          // Only this request receives the antiforgery header. Future
          // endpoints can opt in the same way with `withCsrfProtection()`.
          context: withCsrfProtection(),
        });
      }),
    );
  }
}
