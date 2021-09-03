import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileManagerView } from './file-manager.view';

describe('FileManagerComponent', () => {
  let component: FileManagerView;
  let fixture: ComponentFixture<FileManagerView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileManagerView ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileManagerView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
