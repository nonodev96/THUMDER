import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PixiCycleClockDiagramComponent } from './pixi-cycle-clock-diagram.component';

describe('PipelinePixiComponent', () => {
  let component: PixiCycleClockDiagramComponent;
  let fixture: ComponentFixture<PixiCycleClockDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PixiCycleClockDiagramComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PixiCycleClockDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
