import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';

import { AuthApi } from './auth-api';
import { AuthResponse } from '@/auth/interfaces/auth-response.interface';
import { createUser } from 'src/testing/mocks';

const baseUrl = environment.baseUrl;

describe('AuthApi', () => {
  let service: AuthApi;
  let httpTesting: HttpTestingController;

  const authResponse = (roles: string[] = ['user']): AuthResponse => ({
    token: 'fake-token',
    user: createUser({ roles }),
  });

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthApi);
    httpTesting = TestBed.inject(HttpTestingController);

    // Vacía el `checkStatusResource` que se dispara al construir el servicio.
    // Sin token en localStorage no genera petición HTTP.
    TestBed.tick();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start as not-authenticated when there is no stored token', () => {
    expect(service.authStatus()).toBe('not-authenticated');
    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAdmin()).toBeFalse();
  });

  describe('login', () => {
    it('should authenticate the user and persist the token', () => {
      let result: boolean | undefined;
      service.login('test@teslo.com', '123456').subscribe((value) => (result = value));

      const req = httpTesting.expectOne(`${baseUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@teslo.com', password: '123456' });

      req.flush(authResponse());

      expect(result).toBeTrue();
      expect(service.authStatus()).toBe('authenticated');
      expect(service.user()?.email).toBe('test@teslo.com');
      expect(service.token()).toBe('fake-token');
      expect(localStorage.getItem('token')).toBe('fake-token');
    });

    it('should log the user out when the request fails', () => {
      localStorage.setItem('token', 'stale-token');

      let result: boolean | undefined;
      service.login('test@teslo.com', 'bad-password').subscribe((value) => (result = value));

      httpTesting
        .expectOne(`${baseUrl}/auth/login`)
        .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(result).toBeFalse();
      expect(service.authStatus()).toBe('not-authenticated');
      expect(service.user()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('signUp', () => {
    it('should register and authenticate the user', () => {
      let result: boolean | undefined;
      service
        .signUp('test@teslo.com', '123456', 'Test User')
        .subscribe((value) => (result = value));

      const req = httpTesting.expectOne(`${baseUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@teslo.com',
        password: '123456',
        fullName: 'Test User',
      });

      req.flush(authResponse());

      expect(result).toBeTrue();
      expect(service.authStatus()).toBe('authenticated');
    });

    it('should return false when the registration fails', () => {
      let result: boolean | undefined;
      service
        .signUp('test@teslo.com', '123456', 'Test User')
        .subscribe((value) => (result = value));

      httpTesting
        .expectOne(`${baseUrl}/auth/register`)
        .flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });

      expect(result).toBeFalse();
      expect(service.authStatus()).toBe('not-authenticated');
    });
  });

  describe('checkStatus', () => {
    it('should return false without hitting the API when there is no token', () => {
      let result: boolean | undefined;
      service.checkStatus().subscribe((value) => (result = value));

      httpTesting.expectNone(`${baseUrl}/auth/check-status`);
      expect(result).toBeFalse();
    });

    it('should renew the session when the stored token is valid', () => {
      localStorage.setItem('token', 'stored-token');

      let result: boolean | undefined;
      service.checkStatus().subscribe((value) => (result = value));

      const req = httpTesting.expectOne(`${baseUrl}/auth/check-status`);
      expect(req.request.method).toBe('GET');

      req.flush(authResponse());

      expect(result).toBeTrue();
      expect(service.authStatus()).toBe('authenticated');
      expect(localStorage.getItem('token')).toBe('fake-token');
    });

    it('should log the user out when the stored token is rejected', () => {
      localStorage.setItem('token', 'expired-token');

      let result: boolean | undefined;
      service.checkStatus().subscribe((value) => (result = value));

      httpTesting
        .expectOne(`${baseUrl}/auth/check-status`)
        .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(result).toBeFalse();
      expect(service.authStatus()).toBe('not-authenticated');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should be true when the user has the admin role', () => {
      service.login('admin@teslo.com', '123456').subscribe();
      httpTesting.expectOne(`${baseUrl}/auth/login`).flush(authResponse(['admin', 'user']));

      expect(service.isAdmin()).toBeTrue();
    });

    it('should be false when the user does not have the admin role', () => {
      service.login('test@teslo.com', '123456').subscribe();
      httpTesting.expectOne(`${baseUrl}/auth/login`).flush(authResponse(['user']));

      expect(service.isAdmin()).toBeFalse();
    });
  });

  describe('logout', () => {
    it('should clear the session state', () => {
      service.login('test@teslo.com', '123456').subscribe();
      httpTesting.expectOne(`${baseUrl}/auth/login`).flush(authResponse());

      service.logout();

      expect(service.user()).toBeNull();
      expect(service.token()).toBeNull();
      expect(service.authStatus()).toBe('not-authenticated');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
