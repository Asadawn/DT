import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const PUBLIC_ROUTES = [
  '/auth/sign-in',
  '/auth/forgot-password',
  '/auth/check-email',
  '/auth/reset-password',
];

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/sign-in'], { queryParams: { returnUrl: state.url } });
};
