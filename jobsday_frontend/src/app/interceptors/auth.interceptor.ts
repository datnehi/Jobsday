import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('token');
  if (!token) {
    return next(req);
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: any) => {

      if (err instanceof HttpErrorResponse && err.status === 401) {

        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          authService.clearUser();
          router.navigate(['/login']);
          return throwError(() => err);
        }
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken(refreshToken).pipe(
            switchMap((res) => {
              isRefreshing = false;

              if (res.status != 200) {
                authService.clearUser();
                router.navigate(['/login']);
                return throwError(() => err);
              }
              if (res?.data) {
                const newToken = res.data.token;
                const newRefresh = res.data.refreshToken;

                localStorage.setItem('token', newToken);
                localStorage.setItem('refresh_token', newRefresh);

                refreshTokenSubject.next(newToken);

                return next(
                  authReq.clone({
                    setHeaders: { Authorization: `Bearer ${newToken}` }
                  })
                );
              }

              authService.clearUser();
              router.navigate(['/login']);
              return throwError(() => err);
            }),
            catchError(() => {
              isRefreshing = false;
              authService.clearUser();
              router.navigate(['/login']);
              return throwError(() => err);
            })
          );
        }

        return refreshTokenSubject.pipe(
          filter(t => t != null),
          take(1),
          switchMap((t) => {
            return next(
              authReq.clone({
                setHeaders: { Authorization: `Bearer ${t}` }
              })
            );
          })
        );
      }

      return throwError(() => err);
    })
  );
};
