import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AnalyseComponent } from './analyse.component';
import { LexiconEndpointsService } from '../../../api';
import { ResizablePanelDirective } from '../../shared/directives/resizable-panel.directive';
import { of } from 'rxjs';

describe('AnalyseComponent', () => {
  let lexiconServiceMock: { lexiconAnalysePost: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    lexiconServiceMock = {
      lexiconAnalysePost: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [AnalyseComponent],
      providers: [
        { provide: LexiconEndpointsService, useValue: lexiconServiceMock },
      ],
    }).compileComponents();
  });

  function getResizer(fixture: ReturnType<typeof TestBed.createComponent<AnalyseComponent>>) {
    return fixture.debugElement
      .query(By.directive(ResizablePanelDirective))
      .injector.get(ResizablePanelDirective);
  }

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AnalyseComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render the analysed panel, resize divider, and desktop-scrollable infopanel', () => {
    const fixture = TestBed.createComponent(AnalyseComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const containers = compiled.querySelectorAll('main > div');
    expect(containers.length).toBe(3);
    expect(containers[0].classList).toContain('flex-1');
    expect(containers[1].getAttribute('role')).toBe('separator');
    // Scroll containment is desktop-only so the panel scrolls with the page on mobile
    expect(containers[2].classList).toContain('lg:sticky');
    expect(containers[2].classList).toContain('lg:overflow-y-auto');
    expect(containers[2].classList).not.toContain('overflow-y-auto');
    expect(containers[2].classList).not.toContain('max-h-[calc(100vh-6rem)]');
    expect(compiled.querySelector('app-analysis')).toBeTruthy();
    expect(compiled.querySelector('app-info-panel')).toBeTruthy();
  });

  it('should resize info panel on pointer drag within clamped bounds', () => {
    const fixture = TestBed.createComponent(AnalyseComponent);
    fixture.detectChanges();
    const resizer = getResizer(fixture);

    expect(resizer.panelWidth()).toBe(450);

    // Simulate drag start at clientX = 800
    const separator = fixture.nativeElement.querySelector('[role="separator"]') as HTMLElement;
    resizer.onResizeStart({
      button: 0,
      clientX: 800,
      pointerId: 1,
      currentTarget: separator,
    } as unknown as PointerEvent);

    expect(resizer.isDragging()).toBe(true);

    // Drag left by 50px (clientX = 750) -> width increases by 50 to 500
    resizer.onResizeMove({ clientX: 750 } as PointerEvent);
    expect(resizer.panelWidth()).toBe(500);

    // Drag far left to exceed MAX_WIDTH (650) -> clamped at 650
    resizer.onResizeMove({ clientX: 400 } as PointerEvent);
    expect(resizer.panelWidth()).toBe(650);

    // Drag far right to exceed MIN_WIDTH (430) -> clamped at 430
    resizer.onResizeMove({ clientX: 1200 } as PointerEvent);
    expect(resizer.panelWidth()).toBe(430);

    // End drag
    resizer.onResizeEnd({ pointerId: 1, currentTarget: separator } as unknown as PointerEvent);
    expect(resizer.isDragging()).toBe(false);
  });

  it('should resize info panel using keyboard arrow keys and reset with Home', () => {
    const fixture = TestBed.createComponent(AnalyseComponent);
    fixture.detectChanges();
    const resizer = getResizer(fixture);

    expect(resizer.panelWidth()).toBe(450);

    // ArrowLeft widens panel
    resizer.onKeyDown({ key: 'ArrowLeft', preventDefault: vi.fn() } as unknown as KeyboardEvent);
    expect(resizer.panelWidth()).toBe(460);

    // ArrowRight narrows panel
    resizer.onKeyDown({ key: 'ArrowRight', preventDefault: vi.fn() } as unknown as KeyboardEvent);
    expect(resizer.panelWidth()).toBe(450);

    // Home resets to default (450)
    resizer.panelWidth.set(500);
    resizer.onKeyDown({ key: 'Home', preventDefault: vi.fn() } as unknown as KeyboardEvent);
    expect(resizer.panelWidth()).toBe(450);
  });
});
