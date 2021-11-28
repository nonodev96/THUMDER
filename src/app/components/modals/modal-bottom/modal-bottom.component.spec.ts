import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalBottomComponent } from './modal-bottom.component';

describe('ModalBottomComponent', () => {
  let component: ModalBottomComponent;
  let fixture: ComponentFixture<ModalBottomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalBottomComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalBottomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
