import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import e from 'express';

export const notAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser;
  if (user) {
    router.navigate(['/notfound']);
    return false;
  }
  return true;
};
