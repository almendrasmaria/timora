import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRoute = req.url.includes('/auth/');
      const sessionExpired = !isAuthRoute && (error.status === 401 || error.status === 403);

      if (sessionExpired && auth.isAuthenticated()) {
        auth.logout();
        void router.navigate(['/auth/login'], { queryParams: { sessionExpired: '1' } });
      }

      return throwError(() => error);
    })
  );
};
