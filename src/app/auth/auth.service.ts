import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, REQUEST, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { AuthEndpointsService, CsrfTokenResponse, MeResponse } from '../../api';
import { CsrfTokenStore } from './csrf-token.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authEndpointsService = inject(AuthEndpointsService);
  private readonly csrfTokenStore = inject(CsrfTokenStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly serverRequest = inject(REQUEST, { optional: true });

  private readonly userSignal = signal<MeResponse | null>(null);
  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly csrfToken = this.csrfTokenStore.token;

  private inFlightCheck$?: Observable<boolean>;
  private inFlightCsrf$?: Observable<string>;

  checkAuth(forceRefresh = false): Observable<boolean> {
    if (isPlatformServer(this.platformId) && !this.hasServerCookie()) {
      this.userSignal.set(null);
      return of(false);
    }

    if (!forceRefresh && this.userSignal()) {
      return of(true);
    }

    if (this.inFlightCheck$) {
      return this.inFlightCheck$;
    }

    this.inFlightCheck$ = this.authEndpointsService
      .authMeGet('body', { withCredentials: true })
      .pipe(
        switchMap((user) => {
          this.userSignal.set(user);

          if (!isPlatformBrowser(this.platformId)) {
            return of(true);
          }

          // The token is tied to the session, so refresh it whenever we
          // discover an authenticated session (e.g. after a page reload).
          return this.fetchCsrfToken().pipe(
            map(() => true),
            catchError(() => of(true)),
          );
        }),
        catchError(() => {
          this.userSignal.set(null);
          return of(false);
        }),
        finalize(() => {
          this.inFlightCheck$ = undefined;
        }),
        shareReplay(1),
      );

    return this.inFlightCheck$;
  }

  /**
   * Signs in with a verification token and immediately provisions the
   * antiforgery token required by state-changing requests (e.g. file uploads).
   *
   * A CSRF failure does not fail the sign-in itself: the session cookie is
   * already valid and the next guarded navigation retries the fetch.
   */
  verifySignIn(token: string): Observable<void> {
    return this.authEndpointsService
      .authVerifyPost({ token }, 'body', { withCredentials: true })
      .pipe(
        switchMap(() =>
          this.fetchCsrfToken(true).pipe(catchError(() => of(null))),
        ),
        map(() => undefined),
      );
  }

  fetchCsrfToken(forceRefresh = false): Observable<string> {
    const existingToken = this.csrfTokenStore.token();
    if (!forceRefresh && existingToken) {
      return of(existingToken);
    }

    if (this.inFlightCsrf$) {
      return this.inFlightCsrf$;
    }

    this.inFlightCsrf$ = this.authEndpointsService
      .authCsrfGet('body', { withCredentials: true })
      .pipe(
        map((response: CsrfTokenResponse) => {
          this.csrfTokenStore.setToken(response.token);
          return response.token;
        }),
        finalize(() => {
          this.inFlightCsrf$ = undefined;
        }),
        shareReplay(1),
      );

    return this.inFlightCsrf$;
  }

  setUser(user: MeResponse | null): void {
    this.userSignal.set(user);
  }

  clearAuth(): void {
    this.userSignal.set(null);
    this.csrfTokenStore.clear();
  }

  private hasServerCookie(): boolean {
    const headers = this.serverRequest?.headers;
    if (headers instanceof Headers) {
      return Boolean(headers.get('cookie'));
    }

    const cookie = (headers as unknown as Record<string, string | string[] | undefined> | undefined)?.['cookie'];
    return Array.isArray(cookie) ? cookie.length > 0 : Boolean(cookie);
  }
}
