import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugView } from './debug-view';

describe('DebugComponent', () => {
  let component: DebugView;
  let fixture: ComponentFixture<DebugView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DebugView ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DebugView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
