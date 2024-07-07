import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CognitoService } from './cognito.service';
import { from, Observable } from 'rxjs';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes(environment.apiUrl)) {
    return from(next(req));
  }
  const cognitoService = inject(CognitoService);

  return new Observable((observer) => {
    cognitoService.getSession().then((session) => {
      if (session) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: session.getIdToken().getJwtToken(),
          },
        });
        next(authReq).subscribe(
          (event) => observer.next(event),
          (err) => observer.error(err),
          () => observer.complete(),
        );
      } else {
        next(req).subscribe(
          (event) => observer.next(event),
          (err) => observer.error(err),
          () => observer.complete(),
        );
      }
    });
  });
};
