import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';

import { FormErrorLabel } from './form-error-label';

describe('FormErrorLabel', () => {
  let fixture: ComponentFixture<FormErrorLabel>;

  const renderWith = (control: FormControl) => {
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    return (fixture.nativeElement as HTMLElement).querySelector('span')!.textContent?.trim();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormErrorLabel],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(FormErrorLabel);
  });

  it('should create', () => {
    fixture.componentRef.setInput('control', new FormControl(''));

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show a message while the control has not been touched', () => {
    const control = new FormControl('', Validators.required);

    expect(renderWith(control)).toBe('');
    expect(fixture.componentInstance.errorMessage).toBeNull();
  });

  it('should show the error message once the control is touched', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();

    expect(renderWith(control)).toBe('Este campo es requerido');
  });

  it('should not show a message for a valid touched control', () => {
    const control = new FormControl('Teslo', Validators.required);
    control.markAsTouched();

    expect(renderWith(control)).toBe('');
    expect(fixture.componentInstance.errorMessage).toBeNull();
  });
});
