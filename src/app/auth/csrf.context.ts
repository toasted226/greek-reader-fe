import { HttpContext, HttpContextToken } from '@angular/common/http';

export const CSRF_HEADER_NAME = 'X-CSRF-TOKEN';

/**
 * Marks a request as requiring the antiforgery header.
 *
 * Only requests explicitly marked with this context receive the CSRF token.
 * Add `withCsrfProtection()` to a request's options to opt in; future
 * endpoints can reuse the same mechanism.
 */
export const CSRF_PROTECTED = new HttpContextToken<boolean>(() => false);

export function withCsrfProtection(context?: HttpContext): HttpContext {
  return (context ?? new HttpContext()).set(CSRF_PROTECTED, true);
}
