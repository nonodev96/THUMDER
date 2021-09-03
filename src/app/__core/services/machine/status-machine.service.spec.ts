import { TestBed } from '@angular/core/testing';

import { StatusMachineService } from './status-machine.service';

describe('StatusMachineService', () => {
  let service: StatusMachineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatusMachineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
