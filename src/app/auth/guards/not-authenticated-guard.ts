import { AuthApi } from '../services/auth/auth-api';
import { Router, type CanMatchFn } from '@angular/router';

import { inject } from '@angular/core';

import { firstValueFrom } from 'rxjs';

export const notAuthenticatedGuard: CanMatchFn = async (route, segments) => {

  const authService = inject(AuthApi);
  const router = inject(Router);

  const isNotAuthenticated = await firstValueFrom( authService.checkStatus() );

  if ( isNotAuthenticated ) {
    router.navigateByUrl('/');
    return false;
  }

  return true;
};
