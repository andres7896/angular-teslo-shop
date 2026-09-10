import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { StroreFrontLayout } from './strore-front-layout';
import { AuthApi } from '@/auth/services/auth/auth-api';
import { createAuthApiMock } from 'src/testing/mocks';

describe('StroreFrontLayout', () => {
  let fixture: ComponentFixture<StroreFrontLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StroreFrontLayout],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthApi, useValue: createAuthApiMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StroreFrontLayout);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the navbar', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('front-navbar')).not.toBeNull();
  });

  it('should render the router outlet for the store pages', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).not.toBeNull();
  });
});
