import { TestBed } from '@angular/core/testing';

import { ConvertEnumService } from './convert-enum.service';

describe('ConvertEnumService', () => {
  let service: ConvertEnumService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConvertEnumService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
