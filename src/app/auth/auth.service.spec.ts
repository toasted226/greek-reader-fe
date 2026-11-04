import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { CsrfTokenStore } from './csrf-token.store';
import { AuthEndpointsService, MeResponse } from '../../api';

describe('AuthService', () => {
  let service: AuthService;
  let csrfTokenStore: CsrfTokenStore;
  let authEndpointsServiceMock: {
    authMeGet: ReturnType<typeof vi.fn>;
    authCsrfGet: ReturnType<typeof vi.fn>;
    authVerifyPost: ReturnType<typeof vi.fn>;
  };

  const setupTestBed = (
    platformId = 'browser',
    authMeGetMock = vi.fn().mockReturnValue(of({})),
    serverRequestMock: any = null,
    authCsrfGetMock = vi.fn().mockReturnValue(of({ token: 'csrf-token' })),
    authVerifyPostMock = vi.fn().mockReturnValue(of(undefined)),
  ) => {
    TestBed.resetTestingModule();
    authEndpointsServiceMock = {
      authMeGet: authMeGetMock,
      authCsrfGet: authCsrfGetMock,
      authVerifyPost: authVerifyPostMock,
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthEndpointsService, useValue: authEndpointsServiceMock },
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: REQUEST, useValue: serverRequestMock },
      ],
    });

    service = TestBed.inject(AuthService);
    csrfTokenStore = TestBed.inject(CsrfTokenStore);
  };

  beforeEach(() => {
    setupTestBed();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.csrfToken()).toBeNull();
  });

  it('should authenticate user if /auth/me succeeds', async () => {
    const mockUser: MeResponse = {
      id: '123',
      email: 'user@example.com',
      createdAt: new Date(),
    };
    setupTestBed('browser', vi.fn().mockReturnValue(of(mockUser)));

    const result = await new Promise<boolean>((resolve) => {
      service.checkAuth().subscribe(resolve);
    });

    expect(result).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(authEndpointsServiceMock.authMeGet).toHaveBeenCalledWith('body', { withCredentials: true });
    expect(authEndpointsServiceMock.authCsrfGet).toHaveBeenCalledWith('body', { withCredentials: true });
    expect(service.csrfToken()).toBe('csrf-token');
  });

  it('should still authenticate if the CSRF token request fails', async () => {
    setupTestBed(
      'browser',
      vi.fn().mockReturnValue(of({})),
      null,
      vi.fn().mockReturnValue(throwError(() => new Error('CSRF failed'))),
    );

    const result = await new Promise<boolean>((resolve) => {
      service.checkAuth().subscribe(resolve);
    });

    expect(result).toBe(true);
    expect(service.csrfToken()).toBeNull();
  });

  it('should return false and clear user if /auth/me fails', async () => {
    setupTestBed('browser', vi.fn().mockReturnValue(throwError(() => new Error('Unauthorized'))));

    const result = await new Promise<boolean>((resolve) => {
      service.checkAuth().subscribe(resolve);
    });

    expect(result).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(authEndpointsServiceMock.authCsrfGet).not.toHaveBeenCalled();
  });

  it('should not call endpoint again if user is already loaded and forceRefresh is false', async () => {
    const mockUser: MeResponse = {
      id: '123',
      email: 'user@example.com',
      createdAt: new Date(),
    };
    service.setUser(mockUser);

    const result = await new Promise<boolean>((resolve) => {
      service.checkAuth().subscribe(resolve);
    });

    expect(result).toBe(true);
    expect(authEndpointsServiceMock.authMeGet).not.toHaveBeenCalled();
    expect(authEndpointsServiceMock.authCsrfGet).not.toHaveBeenCalled();
  });

  it('should return false on server platform when no cookie is present', async () => {
    setupTestBed('server', vi.fn(), null);

    const result = await new Promise<boolean>((resolve) => {
      service.checkAuth().subscribe(resolve);
    });

    expect(result).toBe(false);
    expect(authEndpointsServiceMock.authMeGet).not.toHaveBeenCalled();
    expect(authEndpointsServiceMock.authCsrfGet).not.toHaveBeenCalled();
  });

  it('should check auth on server platform when cookie header is present', async () => {
    const mockUser: MeResponse = {
      id: '123',
      email: 'user@example.com',
      createdAt: new Date(),
    };
    const mockRequest = {
      headers: new Headers({ cookie: 'session=123' }),
    };
    setupTestBed('server', vi.fn().mockReturnValue(of(mockUser)), mockRequest);

    const result = await new Promise<boolean>((resolve) => {
      service.checkAuth().subscribe(resolve);
    });

    expect(result).toBe(true);
    expect(authEndpointsServiceMock.authMeGet).toHaveBeenCalledWith('body', { withCredentials: true });
    expect(authEndpointsServiceMock.authCsrfGet).not.toHaveBeenCalled();
  });

  it('should verify sign-in and fetch the CSRF token afterwards', async () => {
    const result = await new Promise<void>((resolve, reject) => {
      service.verifySignIn('verification-token').subscribe({
        next: resolve,
        error: reject,
      });
    });

    expect(result).toBeUndefined();
    expect(authEndpointsServiceMock.authVerifyPost).toHaveBeenCalledWith(
      { token: 'verification-token' },
      'body',
      { withCredentials: true },
    );
    expect(authEndpointsServiceMock.authCsrfGet).toHaveBeenCalledWith('body', { withCredentials: true });
    expect(service.csrfToken()).toBe('csrf-token');
  });

  it('should consider sign-in successful when the CSRF fetch fails', async () => {
    setupTestBed(
      'browser',
      vi.fn().mockReturnValue(of({})),
      null,
      vi.fn().mockReturnValue(throwError(() => new Error('CSRF failed'))),
    );

    const result = await new Promise<void>((resolve, reject) => {
      service.verifySignIn('verification-token').subscribe({
        next: resolve,
        error: reject,
      });
    });

    expect(result).toBeUndefined();
    expect(service.csrfToken()).toBeNull();
  });

  it('should fetch the CSRF token only once unless forced', async () => {
    await new Promise<void>((resolve) => {
      service.fetchCsrfToken().subscribe(() => resolve());
    });
    await new Promise<void>((resolve) => {
      service.fetchCsrfToken().subscribe(() => resolve());
    });

    expect(authEndpointsServiceMock.authCsrfGet).toHaveBeenCalledTimes(1);
    expect(service.csrfToken()).toBe('csrf-token');
  });

  it('should clear the CSRF token when auth is cleared', () => {
    csrfTokenStore.setToken('csrf-token');

    service.clearAuth();

    expect(service.csrfToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });
});
