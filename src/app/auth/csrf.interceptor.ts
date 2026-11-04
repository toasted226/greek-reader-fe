import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CSRF_HEADER_NAME, CSRF_PROTECTED } from './csrf.context';
import { CsrfTokenStore } from './csrf-token.store';

/**
 * Attaches the antiforgery request token to requests that opt in via
 * `withCsrfProtection()`. The token is kept in memory by `CsrfTokenStore`.
 *
 * This interceptor must not inject `HttpClient`/`AuthService`, otherwise
 * Angular would create a circular dependency through the interceptor chain.
 */
@Injectable({ providedIn: 'root' })
export class CsrfInterceptor implements HttpInterceptor {
  private readonly csrfTokenStore = inject(CsrfTokenStore);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.context.get(CSRF_PROTECTED)) {
      return next.handle(req);
    }

    const token = this.csrfTokenStore.token();
    if (!token || req.headers.has(CSRF_HEADER_NAME)) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        headers: req.headers.set(CSRF_HEADER_NAME, token),
      }),
    );
  }
}
