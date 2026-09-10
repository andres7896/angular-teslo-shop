import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlSegment } from '@angular/router';
import { of } from 'rxjs';

import { notAuthenticatedGuard } from './not-authenticated-guard';
import { AuthApi } from '@/auth/services/auth/auth-api';
import { createAuthApiMock } from 'src/testing/mocks';

describe('notAuthenticatedGuard', () => {
  let authApi: ReturnType<typeof createAuthApiMock>;
  let router: jasmine.SpyObj<Router>;

  const runGuard = () =>
    TestBed.runInInjectionContext(() => notAuthenticatedGuard({} as Route, [] as UrlSegment[]));

  beforeEach(() => {
    authApi = createAuthApiMock();
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthApi, useValue: authApi },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should be created', () => {
    expect(notAuthenticatedGuard).toBeTruthy();
  });

  it('should allow the route when there is no active session', async () => {
    authApi.checkStatus.and.returnValue(of(false));

    await expectAsync(runGuard()).toBeResolvedTo(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should redirect to the store front when the user is already authenticated', async () => {
    authApi.checkStatus.and.returnValue(of(true));

    await expectAsync(runGuard()).toBeResolvedTo(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
