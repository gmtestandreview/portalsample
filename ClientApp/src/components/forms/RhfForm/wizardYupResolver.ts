import get from 'lodash/get';
import set from 'lodash/set';
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { ValidationError } from 'yup';
import { isHidden } from '../utils';
import type { Hideable, ValidationSchema } from '../types';

/** Which schema validates: `saveAndExit` is the soft one, `next` the hard one. */
export type SubmitMode = 'next' | 'saveAndExit';

interface WizardYupResolverOptions {
  softSchema: ValidationSchema | undefined;
  hardSchema: ValidationSchema | undefined;
  /** Read at validation time; the mode is not stored in the form values. */
  getMode: () => SubmitMode;
  /** Read at validation time so rule changes apply without a new resolver. */
  getHidden: () => Hideable;
}

const toFieldErrors = <TFieldValues extends FieldValues>(
  error: ValidationError,
  values: TFieldValues,
  hidden: Hideable
): FieldErrors<TFieldValues> => {
  const fieldErrors = {};
  const isVisible = (path: string) => !isHidden(path, hidden, values);
  const inner = error.inner ?? [];

  if (inner.length > 0) {
    inner.forEach((innerError) => {
      const { path } = innerError;
      if (path && isVisible(path) && get(fieldErrors, path) === undefined) {
        set(fieldErrors, path, {
          type: 'validation',
          message: innerError.message,
        });
      }
    });
  } else if (error.path && isVisible(error.path)) {
    set(fieldErrors, error.path, {
      type: 'validation',
      message: error.message,
    });
  }
  return fieldErrors as FieldErrors<TFieldValues>;
};

/**
 * Yup resolver for the RHF wizard shell. Keeps the Formik shell's rules: the
 * soft schema applies to save and exit, the hard schema otherwise, only the
 * first message per path is kept, and errors on hidden fields are dropped.
 */
export const createWizardYupResolver =
  <TFieldValues extends FieldValues>({
    softSchema,
    hardSchema,
    getMode,
    getHidden,
  }: WizardYupResolverOptions): Resolver<TFieldValues> =>
  async (values) => {
    const schema = getMode() === 'saveAndExit' ? softSchema : hardSchema;
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
      const errors = toFieldErrors<TFieldValues>(
        error as ValidationError,
        values,
        getHidden()
      );
      return Object.keys(errors).length === 0
        ? { values, errors: {} }
        : { values: {}, errors };
    }
  };
