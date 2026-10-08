import { ReturnMethodValues } from '@/api/web-api-client';
import { createSaveAwareYupResolver } from '@/components/forms/saveAwareYupResolver';
import type { ValidationSchema } from '@/components/forms/types';
import {
  deliveryAndReturnSaveValidation,
  deliveryAndReturnSubmitValidation,
} from '@/routes/acceptQuote/validation';
import * as Yup from 'yup';

describe('createSaveAwareYupResolver', () => {
  const resolver = createSaveAwareYupResolver(
    deliveryAndReturnSaveValidation,
    deliveryAndReturnSubmitValidation
  );

  it('runs the soft schema when saveAndExit is true and the hard schema otherwise, for the same values', async () => {
    const values = {
      returnMethod: ReturnMethodValues.ClientWillProvide,
      saveAndExit: true,
    };

    const softResult = await resolver(values, undefined, {} as never);
    const hardResult = await resolver(
      { ...values, saveAndExit: false },
      undefined,
      {} as never
    );

    expect(softResult.errors).toEqual({});
    expect(hardResult.errors).toHaveProperty('carrierName');
    expect(hardResult.errors).toHaveProperty('carrierAccountNumber');
  });

  it('resolves both branches of a .when() conditional keyed on a sibling field', async () => {
    const conditionTrue = await resolver(
      { returnMethod: ReturnMethodValues.ClientWillProvide },
      undefined,
      {} as never
    );
    const conditionFalse = await resolver(
      { returnMethod: ReturnMethodValues.ClientToArrange },
      undefined,
      {} as never
    );

    expect(conditionTrue.errors).toHaveProperty('carrierName');
    expect(conditionFalse.errors).not.toHaveProperty('carrierName');
  });

  it('surfaces multiple simultaneous errors under abortEarly: false', async () => {
    const result = await resolver(
      { returnMethod: ReturnMethodValues.ClientWillProvide },
      undefined,
      {} as never
    );

    expect(result.errors).toHaveProperty('carrierName');
    expect(result.errors).toHaveProperty('carrierAccountNumber');
    expect(
      (result.errors as Record<string, { type: string }>)['carrierName']
    ).toMatchObject({ type: 'validation' });
  });

  it('keeps the first Yup error when one field fails multiple rules', async () => {
    const values = { saveAndExit: false, carrierName: '!' };
    const firstError = new Yup.ValidationError(
      'carrierName is too short',
      values.carrierName,
      'carrierName'
    );
    const secondError = new Yup.ValidationError(
      'carrierName contains invalid characters',
      values.carrierName,
      'carrierName'
    );
    const schema: ValidationSchema = {
      validate: () =>
        Promise.reject(new Yup.ValidationError([firstError, secondError])),
    };
    const duplicatePathResolver = createSaveAwareYupResolver(undefined, schema);

    const result = await duplicatePathResolver(values, undefined, {} as never);

    expect(result.errors).toEqual({
      carrierName: {
        type: 'validation',
        message: 'carrierName is too short',
      },
    });
  });

  it('returns empty errors and passes the values through for a fully valid object', async () => {
    const values = { returnMethod: ReturnMethodValues.ClientToArrange };

    const result = await resolver(values, undefined, {} as never);

    expect(result.errors).toEqual({});
    expect(result.values).toEqual(values);
  });

  it('returns empty errors without validating when the active mode has no schema', async () => {
    const softOnlyResolver = createSaveAwareYupResolver(
      undefined,
      deliveryAndReturnSubmitValidation
    );
    const values = {
      returnMethod: ReturnMethodValues.ClientWillProvide,
      saveAndExit: true,
    };

    const result = await softOnlyResolver(values, undefined, {} as never);

    expect(result).toEqual({ values, errors: {} });
  });

  it('maps a validation error with no inner errors to its own path', async () => {
    const values = { saveAndExit: false };
    const topLevelError = new Yup.ValidationError(
      'carrierName is required',
      values,
      'carrierName'
    );
    const schema: ValidationSchema = {
      validate: () => Promise.reject(topLevelError),
    };
    const singleErrorResolver = createSaveAwareYupResolver(undefined, schema);

    const result = await singleErrorResolver(values, undefined, {} as never);

    expect(result.errors).toEqual({
      carrierName: { type: 'validation', message: 'carrierName is required' },
    });
  });

  it('falls back to no inner errors when the validation error has no inner array', async () => {
    const values = { saveAndExit: false };
    const errorWithoutInner = {
      name: 'ValidationError',
      message: 'carrierName is required',
      path: 'carrierName',
    };
    const schema: ValidationSchema = {
      validate: () => Promise.reject(errorWithoutInner),
    };
    const resolverWithoutInner = createSaveAwareYupResolver(undefined, schema);

    const result = await resolverWithoutInner(values, undefined, {} as never);

    expect(result.errors).toEqual({
      carrierName: { type: 'validation', message: 'carrierName is required' },
    });
  });

  it('skips inner errors that have no path', async () => {
    const values = { saveAndExit: false };
    const errorWithPathlessInner = {
      name: 'ValidationError',
      message: '1 error occurred',
      path: undefined,
      inner: [{ path: '', message: 'root-level error with no path' }],
    };
    const schema: ValidationSchema = {
      validate: () => Promise.reject(errorWithPathlessInner),
    };
    const resolverWithPathlessInner = createSaveAwareYupResolver(
      undefined,
      schema
    );

    const result = await resolverWithPathlessInner(
      values,
      undefined,
      {} as never
    );

    expect(result.errors).toEqual({});
  });

  it('returns no field errors when the validation error has neither inner errors nor a path', async () => {
    const values = { saveAndExit: false };
    const pathlessError = {
      name: 'ValidationError',
      message: 'unresolvable validation error',
      path: undefined,
      inner: [],
    };
    const schema: ValidationSchema = {
      validate: () => Promise.reject(pathlessError),
    };
    const resolverWithPathlessError = createSaveAwareYupResolver(
      undefined,
      schema
    );

    const result = await resolverWithPathlessError(
      values,
      undefined,
      {} as never
    );

    expect(result.errors).toEqual({});
  });

  it('rethrows a non-validation error raised during schema validation', async () => {
    const values = { saveAndExit: false };
    const thrownError = new TypeError('unexpected failure');
    const schema: ValidationSchema = {
      validate: () => Promise.reject(thrownError),
    };
    const throwingResolver = createSaveAwareYupResolver(undefined, schema);

    await expect(
      throwingResolver(values, undefined, {} as never)
    ).rejects.toThrow(thrownError);
  });
});
