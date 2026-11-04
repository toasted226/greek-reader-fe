import { Injectable, signal } from '@angular/core';

/**
 * In-memory store for the antiforgery request token.
 *
 * The token is deliberately never persisted (no localStorage/sessionStorage):
 * it is tied to the current session and is re-fetched from `/auth/csrf` when
 * the app bootstraps or the user signs in.
 */
@Injectable({ providedIn: 'root' })
export class CsrfTokenStore {
  private readonly tokenSignal = signal<string | null>(null);

  readonly token = this.tokenSignal.asReadonly();

  setToken(token: string): void {
    this.tokenSignal.set(token);
  }

  clear(): void {
    this.tokenSignal.set(null);
  }
}
