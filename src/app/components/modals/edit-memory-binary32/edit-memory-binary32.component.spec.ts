import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMemoryBinary32Component } from './edit-memory-binary32.component';

describe('EditBinary32Component', () => {
  let component: EditMemoryBinary32Component;
  let fixture: ComponentFixture<EditMemoryBinary32Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditMemoryBinary32Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMemoryBinary32Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
