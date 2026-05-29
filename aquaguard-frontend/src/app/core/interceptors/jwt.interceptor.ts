import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Interceptor:', req.method, req.url); // ← thêm dòng này
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const cloned = token
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      })
    : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      // Bỏ qua refresh-token và logout để tránh loop vô hạn
      const isAuthRequest =
        req.url.includes('/auth/refresh-token') || req.url.includes('/auth/logout');

      if (err.status === 401 && !isAuthRequest) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            const newToken = res.data.accessToken;
            const retried = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken}`),
            });
            return next(retried);
          }),
          catchError(() => {
            authService.logout();
            router.navigate(['/auth/login']);
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
