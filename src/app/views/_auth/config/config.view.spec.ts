import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigView } from './config.view';

describe('ConfigComponent', () => {
  let component: ConfigView;
  let fixture: ComponentFixture<ConfigView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigView ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
