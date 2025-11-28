import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { candidateAuthGuard } from './candidate-auth.guard';

describe('candidateAuthGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => candidateAuthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
