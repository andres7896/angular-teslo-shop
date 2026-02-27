import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';

import { AuthApi } from '../services/auth/auth-api';
import { firstValueFrom } from 'rxjs';

export const isAdminGuard: CanMatchFn = async (route, segments) => {
  const authService = inject(AuthApi);

  await firstValueFrom( authService.checkStatus() );

  return authService.isAdmin();
};
