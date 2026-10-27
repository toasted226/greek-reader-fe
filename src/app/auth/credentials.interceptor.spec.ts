import { describe, it, expect, vi } from 'vitest';
import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { of } from 'rxjs';
import { CredentialsInterceptor } from './credentials.interceptor';
import { BASE_PATH_DEFAULT } from '../../api';

describe('CredentialsInterceptor', () => {
  it('should set withCredentials to true on browser requests', () => {
    TestBed.configureTestingModule({
      providers: [
        CredentialsInterceptor,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: REQUEST, useValue: null },
      ],
    });

    const interceptor = TestBed.inject(CredentialsInterceptor);
    const req = new HttpRequest('GET', '/test');
    const next = {
      handle: vi.fn().mockReturnValue(of({})),
    };

    interceptor.intercept(req, next);

    expect(next.handle).toHaveBeenCalled();
    const interceptedReq: HttpRequest<any> = next.handle.mock.calls[0][0];
    expect(interceptedReq.withCredentials).toBe(true);
    expect(interceptedReq.url).toBe('/test');
    expect(interceptedReq.headers.has('cookie')).toBe(false);
  });

  it('should prepend the backend base URL without forwarding cookies on server requests', () => {
    const mockRequest = {
      headers: new Headers({ cookie: 'session=abc123' }),
    };

    TestBed.configureTestingModule({
      providers: [
        CredentialsInterceptor,
        { provide: BASE_PATH_DEFAULT, useValue: 'http://localhost:3000' },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: mockRequest },
      ],
    });

    const interceptor = TestBed.inject(CredentialsInterceptor);
    const req = new HttpRequest('GET', '/auth/me');
    const next = {
      handle: vi.fn().mockReturnValue(of({})),
    };

    interceptor.intercept(req, next);

    expect(next.handle).toHaveBeenCalled();
    const interceptedReq: HttpRequest<any> = next.handle.mock.calls[0][0];
    expect(interceptedReq.withCredentials).toBe(true);
    expect(interceptedReq.url).toBe('http://localhost:3000/auth/me');
    expect(interceptedReq.headers.has('cookie')).toBe(false);
  });
});
