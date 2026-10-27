import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ScrollToTop } from './scroll-to-top';

@Component({
  imports: [ScrollToTop],
  template: `
    <div #scrollContainer style="height: 300px; overflow-y: scroll;">
      <div style="height: 1000px;">Long content</div>
    </div>
    <app-scroll-to-top [target]="scrollContainer" [threshold]="150" />
  `,
})
class TestHostComponent {}

describe('ScrollToTop', () => {
  let fixture: ComponentFixture<ScrollToTop>;
  let component: ScrollToTop;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollToTop, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollToTop);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and start hidden', () => {
    expect(component).toBeTruthy();
    expect(component.isVisible()).toBe(false);
  });

  it('should become visible when scroll exceeds threshold', () => {
    component.checkScroll(100);
    expect(component.isVisible()).toBe(false);

    component.checkScroll(250);
    expect(component.isVisible()).toBe(true);

    component.checkScroll(50);
    expect(component.isVisible()).toBe(false);
  });

  it('should scroll target element and window to top on scrollToTop()', () => {
    const mockElement = {
      scrollTo: vi.fn(),
      scrollTop: 300,
    } as unknown as HTMLElement;

    const windowScrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    // Bind custom target
    (component as any).target = signal(mockElement);
    component.scrollToTop();

    expect(mockElement.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(windowScrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    windowScrollToSpy.mockRestore();
  });

  it('should update visibility when host container scrolls in integration test', async () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const scrollContainer = compiled.querySelector('div') as HTMLElement;
    const button = compiled.querySelector('button') as HTMLButtonElement;

    expect(button.classList).toContain('opacity-0');
    expect(button.classList).toContain('pointer-events-none');

    // Simulate scroll on container
    scrollContainer.scrollTop = 250;
    scrollContainer.dispatchEvent(new Event('scroll'));
    hostFixture.detectChanges();

    expect(button.classList).toContain('opacity-100');
    expect(button.classList).toContain('pointer-events-auto');
  });
});
