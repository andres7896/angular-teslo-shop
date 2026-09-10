import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { LoginPage } from './login-page';
import { AuthApi } from '@/auth/services/auth/auth-api';
import { createAuthApiMock } from 'src/testing/mocks';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let authApi: ReturnType<typeof createAuthApiMock>;
  let navigateByUrl: jasmine.Spy;

  const fillForm = (email = 'test@teslo.com', password = '123456') =>
    component.loginForm.setValue({ email, password });

  const alert = () => (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');

  beforeEach(async () => {
    authApi = createAuthApiMock();

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthApi, useValue: authApi },
      ],
    }).compileComponents();

    navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl');

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an invalid empty form', () => {
    expect(component.loginForm.invalid).toBeTrue();
    expect(component.hasError()).toBeFalse();
    expect(alert()).toBeNull();
  });

  it('should require a well formed email and a 6 character password', () => {
    component.loginForm.setValue({ email: 'not-an-email', password: '123' });

    expect(component.loginForm.controls.email.hasError('email')).toBeTrue();
    expect(component.loginForm.controls.password.hasError('minlength')).toBeTrue();
  });

  it('should render the error alert and not call the service on an invalid submit', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(authApi.login).not.toHaveBeenCalled();
    expect(component.hasError()).toBeTrue();
    expect(alert()?.textContent).toContain('Error!');
  });

  it('should hide the error after two seconds', () => {
    jasmine.clock().install();
    try {
      component.onSubmit();
      expect(component.hasError()).toBeTrue();

      jasmine.clock().tick(2000);

      expect(component.hasError()).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('should log in and navigate to the store front on success', () => {
    authApi.login.and.returnValue(of(true));
    fillForm();

    component.onSubmit();

    expect(authApi.login).toHaveBeenCalledWith('test@teslo.com', '123456');
    expect(navigateByUrl).toHaveBeenCalledWith('/');
    expect(component.hasError()).toBeFalse();
  });

  it('should show the error and stay on the page when the credentials are rejected', () => {
    authApi.login.and.returnValue(of(false));
    fillForm();

    component.onSubmit();
    fixture.detectChanges();

    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(component.hasError()).toBeTrue();
    expect(alert()).not.toBeNull();
  });

  it('should submit the form when the button is clicked', () => {
    authApi.login.and.returnValue(of(true));
    fillForm();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();

    expect(authApi.login).toHaveBeenCalledTimes(1);
  });
});
