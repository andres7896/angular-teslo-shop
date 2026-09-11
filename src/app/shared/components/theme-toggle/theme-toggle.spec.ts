import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeToggle } from './theme-toggle';
import { ThemeStore } from '@/shared/services/theme-store';
import { createThemeStoreMock } from 'src/testing/mocks';

describe('ThemeToggle', () => {
  let fixture: ComponentFixture<ThemeToggle>;
  let themeStore: ReturnType<typeof createThemeStoreMock>;

  const html = () => fixture.nativeElement as HTMLElement;
  const checkbox = () => html().querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  const label = () => html().querySelector<HTMLLabelElement>('label')!;

  beforeEach(async () => {
    themeStore = createThemeStoreMock({ isDark: false });

    await TestBed.configureTestingModule({
      imports: [ThemeToggle],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ThemeStore, useValue: themeStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render an unchecked checkbox in light mode', () => {
    expect(checkbox().checked).toBeFalse();
  });

  it('should render a checked checkbox in dark mode', () => {
    themeStore.isDark.set(true);
    fixture.detectChanges();

    expect(checkbox().checked).toBeTrue();
  });

  it('should call toggle when the control is clicked', () => {
    checkbox().click();
    fixture.detectChanges();

    expect(themeStore.toggle).toHaveBeenCalledTimes(1);
  });

  it('should announce the action it will perform', () => {
    expect(label().getAttribute('aria-label')).toBe('Activar modo oscuro');

    themeStore.isDark.set(true);
    fixture.detectChanges();

    expect(label().getAttribute('aria-label')).toBe('Activar modo claro');
  });

  it('should render both the sun and the moon icons for the swap', () => {
    expect(html().querySelector('.swap-off')).not.toBeNull();
    expect(html().querySelector('.swap-on')).not.toBeNull();
  });
});
