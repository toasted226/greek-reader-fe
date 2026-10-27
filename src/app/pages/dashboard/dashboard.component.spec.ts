import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { routes } from '../../app.routes';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the dashboard component', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render title in toolbar with Omega symbol and Greek Reader', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const toolbar = compiled.querySelector('mat-toolbar');
    expect(toolbar?.textContent).toContain('Ω');
    expect(toolbar?.textContent).toContain('Greek Reader');
    expect(toolbar?.querySelector('.select-none')).toBeTruthy();
  });

  it('should render universal scroll-to-top component in the shell layout', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const scrollToTop = compiled.querySelector('app-scroll-to-top');
    expect(scrollToTop).toBeTruthy();
    const button = scrollToTop?.querySelector('button');
    expect(button).toBeTruthy();
    expect(button?.getAttribute('aria-label')).toBe('Scroll back to top');
  });

  it('should contain navigation links in the sidenav', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navList = compiled.querySelector('mat-nav-list');
    expect(navList).toBeTruthy();
    expect(compiled.textContent).toContain('Text Analyser');
    expect(compiled.textContent).toContain('Saved Words');
    expect(compiled.textContent).toContain('Profile');
    expect(compiled.textContent).toContain('SettingsComponent');
    expect(compiled.querySelector('a[routerLink="/dashboard/lemmas"]')).toBeTruthy();
  });
});
