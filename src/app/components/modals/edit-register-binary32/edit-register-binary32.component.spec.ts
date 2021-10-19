import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRegisterBinary32Component } from './edit-register-binary32.component';

describe('EditBinary32Component', () => {
  let component: EditRegisterBinary32Component;
  let fixture: ComponentFixture<EditRegisterBinary32Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditRegisterBinary32Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditRegisterBinary32Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
