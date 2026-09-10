import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminDashboardLayout } from './admin-dashboard-layout';
import { AuthApi } from '@/auth/services/auth/auth-api';
import { createAuthApiMock, createUser } from 'src/testing/mocks';

describe('AdminDashboardLayout', () => {
  let fixture: ComponentFixture<AdminDashboardLayout>;
  let component: AdminDashboardLayout;
  let authApi: ReturnType<typeof createAuthApiMock>;

  const html = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    authApi = createAuthApiMock({
      user: createUser({ fullName: 'Andrés García' }),
      authStatus: 'authenticated',
      isAdmin: true,
    });

    await TestBed.configureTestingModule({
      imports: [AdminDashboardLayout],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthApi, useValue: authApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the authenticated user', () => {
    expect(component.user()?.fullName).toBe('Andrés García');
  });

  it('should render the name of the authenticated user', () => {
    expect(html().textContent).toContain('Andrés García');
  });

  it('should render the dashboard navigation links', () => {
    const hrefs = Array.from(html().querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/admin');
    expect(hrefs).toContain('/admin/products');
  });

  it('should render the router outlet for the dashboard pages', () => {
    expect(html().querySelector('router-outlet')).not.toBeNull();
  });

  it('should log the user out from the sidebar button', () => {
    html().querySelector<HTMLButtonElement>('button.btn-ghost')!.click();

    expect(authApi.logout).toHaveBeenCalledTimes(1);
  });
});
