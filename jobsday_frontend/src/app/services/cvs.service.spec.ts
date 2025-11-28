import { TestBed } from '@angular/core/testing';

import { CvsService } from './cvs.service';

describe('CvsService', () => {
  let service: CvsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CvsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
