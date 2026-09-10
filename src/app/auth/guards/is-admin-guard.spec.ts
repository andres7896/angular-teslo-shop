import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route, UrlSegment } from '@angular/router';
import { of } from 'rxjs';

import { isAdminGuard } from './is-admin-guard';
import { AuthApi } from '@/auth/services/auth/auth-api';
import { createAuthApiMock } from 'src/testing/mocks';

describe('isAdminGuard', () => {
  let authApi: ReturnType<typeof createAuthApiMock>;

  const runGuard = () =>
    TestBed.runInInjectionContext(() => isAdminGuard({} as Route, [] as UrlSegment[]));

  const setup = (isAdmin: boolean) => {
    authApi = createAuthApiMock({ isAdmin });

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: AuthApi, useValue: authApi }],
    });
  };

  it('should be created', () => {
    setup(false);
    expect(isAdminGuard).toBeTruthy();
  });

  it('should refresh the session status before deciding', async () => {
    setup(true);
    authApi.checkStatus.and.returnValue(of(true));

    await runGuard();

    expect(authApi.checkStatus).toHaveBeenCalledTimes(1);
  });

  it('should allow the route for an admin user', async () => {
    setup(true);

    await expectAsync(runGuard()).toBeResolvedTo(true);
  });

  it('should block the route for a non admin user', async () => {
    setup(false);

    await expectAsync(runGuard()).toBeResolvedTo(false);
  });
});
