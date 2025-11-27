import { TestBed } from '@angular/core/testing';

import { CompanySkillsService } from './company-skills.service';

describe('CompanySkillsService', () => {
  let service: CompanySkillsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompanySkillsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
