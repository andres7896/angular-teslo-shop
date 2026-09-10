import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';

import { FormUtils } from './form-utils';

describe('FormUtils', () => {
  const fb = new FormBuilder();

  describe('getTextError', () => {
    it('should describe a required error', () => {
      expect(FormUtils.getTextError({ required: true })).toBe('Este campo es requerido');
    });

    it('should describe a minlength error including the required length', () => {
      expect(FormUtils.getTextError({ minlength: { requiredLength: 6, actualLength: 2 } })).toBe(
        'Mínimo de 6 caracteres.',
      );
    });

    it('should describe a min error including the minimum value', () => {
      expect(FormUtils.getTextError({ min: { min: 0, actual: -1 } })).toBe('Valor mínimo de 0');
    });

    it('should describe an email error', () => {
      expect(FormUtils.getTextError({ email: true })).toBe(
        'El valor ingresado no es un correo electrónico',
      );
    });

    it('should describe an emailTaken error', () => {
      expect(FormUtils.getTextError({ emailTaken: true })).toBe(
        'El correo electrónico ya está siendo usado por otro usuario',
      );
    });

    it('should describe a noStrider error', () => {
      expect(FormUtils.getTextError({ noStrider: true })).toBe(
        'No se puede usar el username de strider en la app',
      );
    });

    it('should give a specific message for the email pattern', () => {
      expect(
        FormUtils.getTextError({ pattern: { requiredPattern: FormUtils.emailPattern } }),
      ).toBe('El valor ingresado no luce como un correo electrónico');
    });

    it('should give a generic message for any other pattern', () => {
      expect(FormUtils.getTextError({ pattern: { requiredPattern: FormUtils.slugPattern } })).toBe(
        'Error de patrón contra expresión regular',
      );
    });

    it('should fall back to a generic message for an unknown error', () => {
      expect(FormUtils.getTextError({ custom: true })).toBe(
        'Error de validación no controlado custom',
      );
    });

    it('should return null when there are no errors', () => {
      expect(FormUtils.getTextError({})).toBeNull();
    });
  });

  describe('isValidField', () => {
    it('should be false while the field has not been touched', () => {
      const form = fb.group({ name: ['', Validators.required] });

      expect(FormUtils.isValidField(form, 'name')).toBeFalse();
    });

    it('should be true for a touched field with errors', () => {
      const form = fb.group({ name: ['', Validators.required] });
      form.controls.name.markAsTouched();

      expect(FormUtils.isValidField(form, 'name')).toBeTrue();
    });

    it('should be false for a touched field without errors', () => {
      const form = fb.group({ name: ['Teslo', Validators.required] });
      form.controls.name.markAsTouched();

      expect(FormUtils.isValidField(form, 'name')).toBeFalse();
    });
  });

  describe('getFieldError', () => {
    it('should return null for a field that does not exist', () => {
      const form = fb.group({ name: [''] });

      expect(FormUtils.getFieldError(form, 'unknown')).toBeNull();
    });

    it('should return the message of the current error', () => {
      const form = fb.group({ name: ['', Validators.required] });

      expect(FormUtils.getFieldError(form, 'name')).toBe('Este campo es requerido');
    });

    it('should return null for a valid field', () => {
      const form = fb.group({ name: ['Teslo', Validators.required] });

      expect(FormUtils.getFieldError(form, 'name')).toBeNull();
    });
  });

  describe('form arrays', () => {
    const buildArray = () =>
      new FormArray([new FormControl('', Validators.required), new FormControl('ok')]);

    it('should not flag an untouched control', () => {
      expect(FormUtils.isValidFieldInArray(buildArray(), 0)).toBeFalsy();
    });

    it('should flag a touched control with errors', () => {
      const array = buildArray();
      array.controls[0].markAsTouched();

      expect(FormUtils.isValidFieldInArray(array, 0)).toBeTruthy();
    });

    it('should return the error message of a control inside the array', () => {
      expect(FormUtils.getFieldErrorInArray(buildArray(), 0)).toBe('Este campo es requerido');
    });

    it('should return null for a valid control inside the array', () => {
      expect(FormUtils.getFieldErrorInArray(buildArray(), 1)).toBeNull();
    });

    it('should return null for an empty array', () => {
      expect(FormUtils.getFieldErrorInArray(new FormArray<FormControl>([]), 0)).toBeNull();
    });
  });

  describe('isFieldOneEqualFieldTwo', () => {
    const validator = FormUtils.isFieldOneEqualFieldTwo('password', 'password2');

    it('should return null when both fields match', () => {
      const form = fb.group({ password: ['123456'], password2: ['123456'] });

      expect(validator(form)).toBeNull();
    });

    it('should return the passwordsNotEqual error when they differ', () => {
      const form = fb.group({ password: ['123456'], password2: ['abcdef'] });

      expect(validator(form)).toEqual({ passwordsNotEqual: true });
    });
  });

  describe('notStrider', () => {
    it('should reject the strider value', () => {
      expect(FormUtils.notStrider(new FormControl('strider'))).toEqual({ noStrider: true });
    });

    it('should accept any other value', () => {
      expect(FormUtils.notStrider(new FormControl('teslo'))).toBeNull();
    });
  });

  describe('checkingServerResponse', () => {
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('should report the email as taken for the reserved address', async () => {
      const result = FormUtils.checkingServerResponse(new FormControl('hola@mundo.com'));
      jasmine.clock().tick(2500);

      await expectAsync(result).toBeResolvedTo({ emailTaken: true });
    });

    it('should accept any other address', async () => {
      const result = FormUtils.checkingServerResponse(new FormControl('test@teslo.com'));
      jasmine.clock().tick(2500);

      await expectAsync(result).toBeResolvedTo(null);
    });
  });
});
