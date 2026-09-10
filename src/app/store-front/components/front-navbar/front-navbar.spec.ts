import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FrontNavbar } from './front-navbar';
import { AuthApi } from '@/auth/services/auth/auth-api';
import { createAuthApiMock, createUser } from 'src/testing/mocks';

describe('FrontNavbar', () => {
  let fixture: ComponentFixture<FrontNavbar>;
  let authApi: ReturnType<typeof createAuthApiMock>;

  const html = () => (fixture.nativeElement as HTMLElement);

  beforeEach(async () => {
    authApi = createAuthApiMock({ authStatus: 'checking' });

    await TestBed.configureTestingModule({
      imports: [FrontNavbar],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthApi, useValue: authApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FrontNavbar);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show a loader while the session is being checked', () => {
    expect(html().querySelector('.loading')).not.toBeNull();
  });

  it('should show the gender links', () => {
    const hrefs = Array.from(html().querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/gender/men');
    expect(hrefs).toContain('/gender/women');
    expect(hrefs).toContain('/gender/kids');
  });

  it('should show the login link when the user is not authenticated', () => {
    authApi.authStatus.set('not-authenticated');
    fixture.detectChanges();

    const hrefs = Array.from(html().querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/auth/login');
    expect(html().querySelector('.loading')).toBeNull();
  });

  it('should show the user name and the logout button when authenticated', () => {
    authApi.authStatus.set('authenticated');
    authApi.user.set(createUser({ fullName: 'Andrés García' }));
    fixture.detectChanges();

    expect(html().textContent).toContain('Andrés García');
    expect(html().querySelector('.btn-error')?.textContent).toContain('Salir');
  });

  it('should log the user out when the logout button is clicked', () => {
    authApi.authStatus.set('authenticated');
    authApi.user.set(createUser());
    fixture.detectChanges();

    html().querySelector<HTMLButtonElement>('.btn-error')!.click();

    expect(authApi.logout).toHaveBeenCalledTimes(1);
  });

  it('should hide the admin panel link for a regular user', () => {
    authApi.authStatus.set('authenticated');
    fixture.detectChanges();

    const hrefs = Array.from(html().querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain('/admin');
  });

  it('should show the admin panel link for an admin user', () => {
    authApi.authStatus.set('authenticated');
    authApi.isAdmin.set(true);
    fixture.detectChanges();

    const hrefs = Array.from(html().querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/admin');
  });
});
