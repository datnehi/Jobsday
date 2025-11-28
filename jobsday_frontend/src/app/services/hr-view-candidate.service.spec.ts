import { TestBed } from '@angular/core/testing';

import { HrViewCandidateService } from './hr-view-candidate.service';

describe('HrViewCandidateService', () => {
  let service: HrViewCandidateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HrViewCandidateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
