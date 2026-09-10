import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { RegisterPage } from './register-page';
import { AuthApi } from '@/auth/services/auth/auth-api';
import { createAuthApiMock } from 'src/testing/mocks';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let authApi: ReturnType<typeof createAuthApiMock>;
  let router: jasmine.SpyObj<Router>;

  const fillForm = () =>
    component.registerForm.setValue({
      email: 'test@teslo.com',
      password: '123456',
      fullName: 'Test User',
    });

  const alert = () => (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');

  beforeEach(async () => {
    authApi = createAuthApiMock();
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthApi, useValue: authApi },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an invalid empty form', () => {
    expect(component.registerForm.invalid).toBeTrue();
    expect(alert()).toBeNull();
  });

  it('should require a full name of at least 6 characters', () => {
    component.registerForm.controls.fullName.setValue('Ana');

    expect(component.registerForm.controls.fullName.hasError('minlength')).toBeTrue();
  });

  it('should show the error and not call the service on an invalid submit', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(authApi.signUp).not.toHaveBeenCalled();
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

  it('should register the user and navigate to the store front on success', () => {
    authApi.signUp.and.returnValue(of(true));
    fillForm();

    component.onSubmit();

    expect(authApi.signUp).toHaveBeenCalledWith('test@teslo.com', '123456', 'Test User');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    expect(component.hasError()).toBeFalse();
  });

  it('should show the error when the registration is rejected', () => {
    authApi.signUp.and.returnValue(of(false));
    fillForm();

    component.onSubmit();
    fixture.detectChanges();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.hasError()).toBeTrue();
    expect(alert()).not.toBeNull();
  });

  it('should submit the form when the button is clicked', () => {
    authApi.signUp.and.returnValue(of(true));
    fillForm();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();

    expect(authApi.signUp).toHaveBeenCalledTimes(1);
  });
});
