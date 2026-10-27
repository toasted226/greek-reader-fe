import { isPlatformServer } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, REQUEST, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay } from 'rxjs';
import { AuthEndpointsService, MeResponse } from '../../api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authEndpointsService = inject(AuthEndpointsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly serverRequest = inject(REQUEST, { optional: true });

  private readonly userSignal = signal<MeResponse | null>(null);
  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  private inFlightCheck$?: Observable<boolean>;

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
        map((user) => {
          this.userSignal.set(user);
          return true;
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

  setUser(user: MeResponse | null): void {
    this.userSignal.set(user);
  }

  clearAuth(): void {
    this.userSignal.set(null);
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
