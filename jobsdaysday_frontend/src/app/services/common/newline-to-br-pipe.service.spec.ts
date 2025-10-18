import { TestBed } from '@angular/core/testing';

import { NewlineToBrPipeService } from './newline-to-br-pipe.service';

describe('NewlineToBrPipeService', () => {
  let service: NewlineToBrPipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NewlineToBrPipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
