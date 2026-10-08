import { get, set } from 'lodash';
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { ValidationError } from 'yup';
import type { ValidationSchema } from './types';

type SaveAwareFieldValues = FieldValues & { saveAndExit?: boolean };

function yupErrorToFieldErrors<TFieldValues extends FieldValues>(
  error: ValidationError
): FieldErrors<TFieldValues> {
  const fieldErrors = {};
  const innerErrors = error.inner ?? [];

  if (innerErrors.length > 0) {
    innerErrors.forEach((innerError) => {
      if (innerError.path && get(fieldErrors, innerError.path) === undefined) {
        set(fieldErrors, innerError.path, {
          type: 'validation',
          message: innerError.message,
        });
      }
    });
  } else if (error.path) {
    set(fieldErrors, error.path, {
      type: 'validation',
      message: error.message,
    });
  }

  return fieldErrors as FieldErrors<TFieldValues>;
}

/**
 * Builds an RHF resolver that preserves FormikForm's save-aware Yup behavior:
 * soft validation for save-and-exit and hard validation for normal submit.
 */
export function createSaveAwareYupResolver<
  TFieldValues extends SaveAwareFieldValues,
>(
  softSchema: ValidationSchema | undefined,
  hardSchema: ValidationSchema | undefined
): Resolver<TFieldValues> {
  return async (values) => {
    const schema = values.saveAndExit === true ? softSchema : hardSchema;

    if (!schema) {
      return { values, errors: {} };
    }

    try {
      await schema.validate(values, { abortEarly: false, context: values });
      return { values, errors: {} };
    } catch (error) {
      if ((error as Error).name !== 'ValidationError') {
        throw error;
      }
      return {
        values: {},
        errors: yupErrorToFieldErrors<TFieldValues>(error as ValidationError),
      };
    }
  };
}
