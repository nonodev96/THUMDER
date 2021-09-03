import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PixiPipelineComponent } from './pixi-pipeline.component';

describe('PipelinePixiComponent', () => {
  let component: PixiPipelineComponent;
  let fixture: ComponentFixture<PixiPipelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PixiPipelineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PixiPipelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
