import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { VerifyComponent } from './verify.component';
import { AuthService } from '../../../auth/auth.service';

describe('VerifyComponent', () => {
  let authServiceMock: { verifySignIn: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const createComponent = (
    queryParams: Record<string, string> = {},
    platformId: string = 'browser',
    verifySignInMock = vi.fn().mockReturnValue(of(undefined)),
  ) => {
    TestBed.resetTestingModule();
    authServiceMock = {
      verifySignIn: verifySignInMock,
    };
    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [VerifyComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(queryParams),
            },
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    });

    const fixture = TestBed.createComponent(VerifyComponent);
    return { fixture, component: fixture.componentInstance };
  };

  it('should create the component', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('should show "Signing you in..." and loading spinner while waiting', () => {
    const { fixture, component } = createComponent(
      { token: 'test-token' },
      'browser',
      vi.fn().mockReturnValue(NEVER),
    );

    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Signing you in...');
    expect(compiled.querySelector('mat-progress-spinner')).toBeTruthy();
  });

  it('should verify token and redirect to "/" on success', () => {
    const { fixture } = createComponent({ token: 'valid-token' });

    fixture.detectChanges();

    expect(authServiceMock.verifySignIn).toHaveBeenCalledWith('valid-token');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should show error message when verification fails', () => {
    const { fixture, component } = createComponent({ token: 'invalid-token' });
    authServiceMock.verifySignIn.mockReturnValue(
      throwError(() => new Error('Verification failed')),
    );

    fixture.detectChanges();

    expect(authServiceMock.verifySignIn).toHaveBeenCalledWith('invalid-token');
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe(
      'Unable to verify your sign-in request. Please try again later.',
    );

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(
      'Unable to verify your sign-in request. Please try again later.',
    );
    expect(compiled.querySelector('mat-progress-spinner')).toBeNull();
  });

  it('should show error message immediately if token query parameter is missing', () => {
    const { fixture, component } = createComponent({});

    fixture.detectChanges();

    expect(authServiceMock.verifySignIn).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe(
      'Unable to verify your sign-in request. Please try again later.',
    );

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(
      'Unable to verify your sign-in request. Please try again later.',
    );
  });

  it('should show error message immediately if token query parameter is empty whitespace', () => {
    const { fixture, component } = createComponent({ token: '   ' });

    fixture.detectChanges();

    expect(authServiceMock.verifySignIn).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe(
      'Unable to verify your sign-in request. Please try again later.',
    );
  });

  it('should not verify on server platform', () => {
    const { fixture } = createComponent({ token: 'token-123' }, 'server');

    fixture.detectChanges();

    expect(authServiceMock.verifySignIn).not.toHaveBeenCalled();
  });
});
