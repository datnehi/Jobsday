import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

export function roleGuard(roles: UserRole[]): CanMatchFn {
  return (): Observable<boolean> => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && roles.includes(user.role)) {
          return true;
        }
        router.navigate(['/notfound']);
        return false;
      })
    );
  };
}
