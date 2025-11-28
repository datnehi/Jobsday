import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const candidateAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser;
  if (user) {
    if (user.role === 'ADMIN' || user.role === 'HR') {
      router.navigate(['/notfound']);
      return false;
    }
  }

  return true;
};
