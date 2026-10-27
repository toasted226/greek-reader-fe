import { TestBed } from '@angular/core/testing';
import { AnalyseComponent } from './analyse.component';
import { LexiconEndpointsService } from '../../../api';
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

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AnalyseComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render the analysed panel, resize divider, and sticky scrollable infopanel', () => {
    const fixture = TestBed.createComponent(AnalyseComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const containers = compiled.querySelectorAll('main > div');
    expect(containers.length).toBe(3);
    expect(containers[0].classList).toContain('flex-1');
    expect(containers[1].getAttribute('role')).toBe('separator');
    expect(containers[2].classList).toContain('sticky');
    expect(containers[2].classList).toContain('overflow-y-auto');
    expect(compiled.querySelector('app-analysis')).toBeTruthy();
    expect(compiled.querySelector('app-info-panel')).toBeTruthy();
  });

  it('should resize info panel on pointer drag within clamped bounds', () => {
    const fixture = TestBed.createComponent(AnalyseComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.infoPanelWidth()).toBe(450);

    // Simulate drag start at clientX = 800
    const separator = fixture.nativeElement.querySelector('[role="separator"]') as HTMLElement;
    component.onResizeStart({
      button: 0,
      clientX: 800,
      pointerId: 1,
      currentTarget: separator,
    } as unknown as PointerEvent);

    expect(component.isDragging()).toBe(true);

    // Drag left by 50px (clientX = 750) -> width increases by 50 to 500
    component.onResizeMove({ clientX: 750 } as PointerEvent);
    expect(component.infoPanelWidth()).toBe(500);

    // Drag far left to exceed MAX_WIDTH (650) -> clamped at 650
    component.onResizeMove({ clientX: 400 } as PointerEvent);
    expect(component.infoPanelWidth()).toBe(650);

    // Drag far right to exceed MIN_WIDTH (430) -> clamped at 430
    component.onResizeMove({ clientX: 1200 } as PointerEvent);
    expect(component.infoPanelWidth()).toBe(430);

    // End drag
    component.onResizeEnd({ pointerId: 1, currentTarget: separator } as unknown as PointerEvent);
    expect(component.isDragging()).toBe(false);
  });

  it('should resize info panel using keyboard arrow keys and reset with Home', () => {
    const fixture = TestBed.createComponent(AnalyseComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.infoPanelWidth()).toBe(450);

    // ArrowLeft widens panel
    component.onKeyDown({ key: 'ArrowLeft', preventDefault: vi.fn() } as unknown as KeyboardEvent);
    expect(component.infoPanelWidth()).toBe(460);

    // ArrowRight narrows panel
    component.onKeyDown({ key: 'ArrowRight', preventDefault: vi.fn() } as unknown as KeyboardEvent);
    expect(component.infoPanelWidth()).toBe(450);

    // Home resets to default (450)
    component.infoPanelWidth.set(500);
    component.onKeyDown({ key: 'Home', preventDefault: vi.fn() } as unknown as KeyboardEvent);
    expect(component.infoPanelWidth()).toBe(450);
  });
});
