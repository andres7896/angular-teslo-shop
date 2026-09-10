import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authInterceptor } from './auth-interceptor';
import { AuthApi } from '@/auth/services/auth/auth-api';
import { createAuthApiMock } from 'src/testing/mocks';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authApi: ReturnType<typeof createAuthApiMock>;

  beforeEach(() => {
    authApi = createAuthApiMock();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthApi, useValue: authApi },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(authInterceptor).toBeTruthy();
  });

  it('should attach the stored token as a Bearer authorization header', () => {
    authApi.token = signal<string | null>('my-token');

    httpClient.get('/api/products').subscribe();

    const req = httpTesting.expectOne('/api/products');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');

    req.flush({});
  });

  it('should still send the header when there is no token', () => {
    httpClient.get('/api/products').subscribe();

    const req = httpTesting.expectOne('/api/products');
    expect(req.request.headers.get('Authorization')).toBe('Bearer null');

    req.flush({});
  });
});
