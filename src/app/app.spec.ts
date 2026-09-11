import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { ThemeStore } from '@/shared/services/theme-store';
import { createThemeStoreMock } from 'src/testing/mocks';

describe('App', () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        // Evita que el `ThemeStore` real toque el <html> compartido por los specs.
        { provide: ThemeStore, useValue: createThemeStoreMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
  });

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose the application title', () => {
    expect(fixture.componentInstance['title']()).toBe('teslo-shop');
  });

  it('should render the router outlet', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should log the hello world message on init', () => {
    const logSpy = spyOn(console, 'log');

    fixture.detectChanges();

    expect(logSpy).toHaveBeenCalledWith('Hello World');
  });
});
