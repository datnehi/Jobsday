import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  const http = inject(HttpClient);
  const router = inject(Router);

  return next(authReq).pipe(
    catchError((err: any) => {

      if (err instanceof HttpErrorResponse && err.status === 401) {

        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          const noRedirectPaths = [
            /^\/login/,
            /^\/register/,
            /^\/forgot-password/,
            /^\/jobsday/,
            /^\/notfound/,
            /^\/job(\/|$)/, // match /job and /job/:id
            /^\/company-detail/,
            /^\/$/
          ];
          const currentUrl = (router && (router as any).url) || (typeof window !== 'undefined' ? window.location.pathname : '');
          const isOnNoRedirect = noRedirectPaths.some(regex => regex.test(currentUrl));
          console.log('Current URL:', currentUrl, 'isOnNoRedirect:', isOnNoRedirect);

          if (!isOnNoRedirect) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            router.navigate(['/login']);
          }
          return throwError(() => err);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return http.post<any>(`${environment.apiUrl}auth/refresh-token`, { refreshToken }).pipe(
            switchMap(res => {
              const newToken = res?.data.token;
              const newRefresh = res?.data.refreshToken;

              if (!newToken) {
                isRefreshing = false;
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                router.navigate(['/login']);
                return throwError(() => err);
              }

              localStorage.setItem('token', newToken);
              if (newRefresh) {
                localStorage.setItem('refresh_token', newRefresh);
              }

              refreshTokenSubject.next(newToken);
              isRefreshing = false;

              const retryReq = authReq.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });

              return next(retryReq);
            }),

            catchError(refreshErr => {
              isRefreshing = false;
              refreshTokenSubject.next(null);
              localStorage.removeItem('token');
              localStorage.removeItem('refresh_token');
              router.navigate(['/login']);
              return throwError(() => refreshErr);
            })
          );
        }

        return refreshTokenSubject.pipe(
          filter(t => t != null),
          take(1),
          switchMap((t) => {
            const retryReq = authReq.clone({
              setHeaders: { Authorization: `Bearer ${t}` }
            });
            return next(retryReq);
          })
        );
      }

      if (err instanceof HttpErrorResponse && err.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        router.navigate(['/login']);
      }

      return throwError(() => err);
    })
  );
};
