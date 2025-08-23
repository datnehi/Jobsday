import { CanMatchFn, Route, UrlSegment, Router } from '@angular/router';
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
      take(1), // Lấy giá trị hiện tại rồi hoàn thành
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
