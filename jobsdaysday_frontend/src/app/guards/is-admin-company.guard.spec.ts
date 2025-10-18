import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { isAdminCompanyGuard } from './is-admin-company.guard';

describe('isAdminCompanyGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => isAdminCompanyGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
