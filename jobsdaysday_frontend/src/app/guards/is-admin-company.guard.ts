import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CompanyMemberService } from '../services/company-member.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const isAdminCompanyGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const companyMemberService = inject(CompanyMemberService);
  const router = inject(Router);

  const user = auth.currentUser;
  if (!user || user.role !== 'HR') {
    router.navigate(['/notfound']);
    return of(false);
  }

  return companyMemberService.getMe().pipe(
    map(response => {
      if (response?.data?.isAdmin === true) {
        return true;
      }
      router.navigate(['/notfound']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/notfound']);
      return of(false);
    })
  );
};
