import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { loggingInterceptor } from './logging-interceptor';

describe('loggingInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([loggingInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(loggingInterceptor).toBeTruthy();
  });

  it('should log the requested url and forward the request untouched', () => {
    const logSpy = spyOn(console, 'log');

    httpClient.get('/api/products').subscribe();

    const req = httpTesting.expectOne('/api/products');
    expect(logSpy).toHaveBeenCalledWith('Request made to:', '/api/products');
    expect(req.request.headers.keys().length).toBe(0);

    req.flush({});
  });
});
