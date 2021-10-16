import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBinary32Component } from './edit-binary32.component';

describe('EditBinary32Component', () => {
  let component: EditBinary32Component;
  let fixture: ComponentFixture<EditBinary32Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditBinary32Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditBinary32Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
