import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocsView } from './docs.view';

describe('DocsComponent', () => {
  let component: DocsView;
  let fixture: ComponentFixture<DocsView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocsView ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocsView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
