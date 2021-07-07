import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelinePixiComponent } from './pipeline-pixi.component';

describe('PipelinePixiComponent', () => {
  let component: PipelinePixiComponent;
  let fixture: ComponentFixture<PipelinePixiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PipelinePixiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelinePixiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
