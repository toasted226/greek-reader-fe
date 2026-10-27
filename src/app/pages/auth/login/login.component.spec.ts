import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthEndpointsService } from '../../../../api';

describe('LoginComponent', () => {
  let authServiceMock: { authRequestPost: ReturnType<typeof vi.fn> };

  const createComponent = (authRequestPostMock = vi.fn().mockReturnValue(of({}))) => {
    TestBed.resetTestingModule();
    authServiceMock = {
      authRequestPost: authRequestPostMock,
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [{ provide: AuthEndpointsService, useValue: authServiceMock }],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    return { fixture, component: fixture.componentInstance };
  };

  it('should create the component', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('should render Greek Reader logo with omega symbol', () => {
    const { fixture } = createComponent();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ω');
    expect(compiled.textContent).toContain('Greek Reader');
  });

  it('should have the sign in button disabled when email is empty', () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    component.email.set('user@example.com');
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('should call authRequestPost with email on form submission', () => {
    const { fixture, component } = createComponent();
    component.email.set('test@example.com');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(authServiceMock.authRequestPost).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(component.successMessage()).toContain('We sent a verification link');
  });

  it('should replace button text with loading spinner while request is in flight', () => {
    const { fixture, component } = createComponent(vi.fn().mockReturnValue(NEVER));
    component.email.set('test@example.com');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-progress-spinner')).toBeTruthy();
    expect(compiled.querySelector('button')?.textContent).not.toContain('Sign in');
  });

  it('should display an error message if the request fails', () => {
    const { fixture, component } = createComponent(
      vi.fn().mockReturnValue(throwError(() => new Error('Server error'))),
    );
    component.email.set('test@example.com');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toContain('Unable to process your sign-in request');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Unable to process your sign-in request');
  });
});
