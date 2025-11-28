import { TestBed } from '@angular/core/testing';

import { JobSkillsService } from './job-skills.service';

describe('JobSkillsService', () => {
  let service: JobSkillsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobSkillsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
