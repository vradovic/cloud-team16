import { HttpHeaders, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CognitoService } from './cognito.service';
import { from } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  const cognitoService = inject(CognitoService);
  let authReq: HttpHeaders | null = null;

  from(cognitoService.getSession()).subscribe((session) => {
    if (session) {
      authReq = req.headers.append(
        'Authorization',
        `Bearer ${session.getIdToken()}`,
      );
    }
  });

  if (authReq) {
    return next(authReq);
  }

  return next(req);
};
