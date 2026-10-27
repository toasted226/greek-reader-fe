import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthEndpointsService, MeResponse } from '../../api';

describe('AuthService', () => {
  let service: AuthService;
  let authEndpointsServiceMock: { authMeGet: ReturnType<typeof vi.fn> };

  const setupTestBed = (
    platformId = 'browser',
    authMeGetMock = vi.fn().mockReturnValue(of({})),
    serverRequestMock: any = null,
  ) => {
    TestBed.resetTestingModule();
    authEndpointsServiceMock = {
      authMeGet: authMeGetMock,
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
  };

  beforeEach(() => {
    setupTestBed();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
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
  });

  it('should return false and clear user if /auth/me fails', async () => {
    setupTestBed('browser', vi.fn().mockReturnValue(throwError(() => new Error('Unauthorized'))));

    const result = await new Promise<boolean>((resolve) => {
      service.checkAuth().subscribe(resolve);
    });

    expect(result).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
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
  });

  it('should return false on server platform when no cookie is present', async () => {
    setupTestBed('server', vi.fn(), null);

    const result = await new Promise<boolean>((resolve) => {
      service.checkAuth().subscribe(resolve);
    });

    expect(result).toBe(false);
    expect(authEndpointsServiceMock.authMeGet).not.toHaveBeenCalled();
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
  });
});
