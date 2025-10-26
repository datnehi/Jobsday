import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const homeRedirectGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser;
  if (!user) {
    router.navigate(['/jobsday']);
    return false;
  }

  // Điều hướng theo role
  switch (user.role) {
    case 'HR':
      router.navigate(['/quan-ly-job']);
      break;
    case 'ADMIN':
      router.navigate(['/user-manager']);
      break;
    case 'CANDIDATE':
      router.navigate(['/jobsday']);
      break;
    default:
      router.navigate(['/jobsday']);
  }
  return false;
};
