import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthApi } from '../services/auth/auth-api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const token = inject(AuthApi).token();

  const newReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(newReq);
};
