import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthLayout } from './auth-layout';
import { ThemeStore } from '@/shared/services/theme-store';
import { createThemeStoreMock } from 'src/testing/mocks';

describe('AuthLayout', () => {
  let fixture: ComponentFixture<AuthLayout>;
  let themeStore: ReturnType<typeof createThemeStoreMock>;

  beforeEach(async () => {
    themeStore = createThemeStoreMock();

    await TestBed.configureTestingModule({
      imports: [AuthLayout],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ThemeStore, useValue: themeStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayout);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the router outlet for the auth pages', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should toggle the theme from the auth card', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLInputElement>('theme-toggle input')!.click();

    expect(themeStore.toggle).toHaveBeenCalledTimes(1);
  });
});
