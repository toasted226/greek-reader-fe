import { describe, it, expect, vi } from 'vitest';
import { HttpHeaders, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CSRF_HEADER_NAME, withCsrfProtection } from './csrf.context';
import { CsrfInterceptor } from './csrf.interceptor';
import { CsrfTokenStore } from './csrf-token.store';

describe('CsrfInterceptor', () => {
  const createInterceptor = () => {
    TestBed.configureTestingModule({
      providers: [CsrfInterceptor],
    });

    return {
      interceptor: TestBed.inject(CsrfInterceptor),
      store: TestBed.inject(CsrfTokenStore),
    };
  };

  it('should add the CSRF header to requests marked as CSRF protected', () => {
    const { interceptor, store } = createInterceptor();
    store.setToken('csrf-token');

    const req = new HttpRequest('POST', '/files', null, {
      context: withCsrfProtection(),
    });
    const next = { handle: vi.fn().mockReturnValue(of({})) };

    interceptor.intercept(req, next);

    const interceptedReq: HttpRequest<unknown> = next.handle.mock.calls[0][0];
    expect(interceptedReq.headers.get(CSRF_HEADER_NAME)).toBe('csrf-token');
  });

  it('should not add the CSRF header to requests without opt-in', () => {
    const { interceptor, store } = createInterceptor();
    store.setToken('csrf-token');

    const req = new HttpRequest('POST', '/lemmas', null);
    const next = { handle: vi.fn().mockReturnValue(of({})) };

    interceptor.intercept(req, next);

    const interceptedReq: HttpRequest<unknown> = next.handle.mock.calls[0][0];
    expect(interceptedReq.headers.has(CSRF_HEADER_NAME)).toBe(false);
  });

  it('should not add the CSRF header when no token is available', () => {
    const { interceptor } = createInterceptor();

    const req = new HttpRequest('POST', '/files', null, {
      context: withCsrfProtection(),
    });
    const next = { handle: vi.fn().mockReturnValue(of({})) };

    interceptor.intercept(req, next);

    const interceptedReq: HttpRequest<unknown> = next.handle.mock.calls[0][0];
    expect(interceptedReq.headers.has(CSRF_HEADER_NAME)).toBe(false);
  });

  it('should not overwrite an existing CSRF header', () => {
    const { interceptor, store } = createInterceptor();
    store.setToken('stored-token');

    const req = new HttpRequest('POST', '/files', null, {
      headers: new HttpHeaders({ [CSRF_HEADER_NAME]: 'explicit-token' }),
      context: withCsrfProtection(),
    });
    const next = { handle: vi.fn().mockReturnValue(of({})) };

    interceptor.intercept(req, next);

    const interceptedReq: HttpRequest<unknown> = next.handle.mock.calls[0][0];
    expect(interceptedReq.headers.get(CSRF_HEADER_NAME)).toBe('explicit-token');
  });
});
