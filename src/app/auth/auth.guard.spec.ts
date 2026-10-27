import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { authChildGuard, authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let authServiceMock: { checkAuth: ReturnType<typeof vi.fn> };
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  const setupTestBed = (isAuthenticated: boolean) => {
    authServiceMock = {
      checkAuth: vi.fn().mockReturnValue(of(isAuthenticated)),
    };
    const dummyUrlTree = {} as UrlTree;
    routerMock = {
      createUrlTree: vi.fn().mockReturnValue(dummyUrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  };

  it('should allow navigation if user is authenticated', async () => {
    setupTestBed(true);

    const guardResult = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );

    const result = await new Promise((resolve) => {
      (guardResult as any).subscribe(resolve);
    });

    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /auth/login if user is not authenticated', async () => {
    setupTestBed(false);

    const guardResult = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );

    const result = await new Promise((resolve) => {
      (guardResult as any).subscribe(resolve);
    });

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toEqual({});
  });

  it('should delegate authChildGuard to authGuard', async () => {
    setupTestBed(true);

    const guardResult = TestBed.runInInjectionContext(() =>
      authChildGuard({} as ActivatedRouteSnapshot, { url: '/dashboard/analyse' } as RouterStateSnapshot),
    );

    const result = await new Promise((resolve) => {
      (guardResult as any).subscribe(resolve);
    });

    expect(result).toBe(true);
  });
});
