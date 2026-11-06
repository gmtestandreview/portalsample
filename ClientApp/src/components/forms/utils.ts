import { removeEmptyKeys } from '../../utils';
import { getIn, isObject, setIn } from './formPath';
import type { ValidationError } from 'yup';
import type {
  FormErrors,
  FormValues,
  Hideable,
  ValidationSchema,
} from './types';
/**
 * Yup types `ValidationError.inner` as always present, but ValidationError-shaped
 * errors can arrive without it. The parameter type admits that, so callers keep
 * the guard instead of trusting the stricter Yup type.
 */
export const getInnerErrors = (error: {
  inner?: ValidationError[] | undefined;
}): ValidationError[] | undefined => error.inner;

export const isFieldPathHidden = <TValues>(
  hidden: unknown,
  values: TValues,
): boolean =>
  hidden !== undefined &&
  (hidden === true ||
    (typeof hidden === 'function' &&
      (hidden as (currentValues: TValues) => boolean)(values)));

const parentPath = (path: string): string =>
  path.replace(/(?:\.[^.[]+|\[[^\]]+\])$/, '');

export const isHidden = <T, TValues>(
  fieldPath: string,
  hidden: Hideable<Partial<T>, Partial<TValues>>,
  values: TValues,
): boolean => {
  const isFieldHidden: unknown = getIn(hidden, fieldPath);
  if (isFieldPathHidden(isFieldHidden, values)) {
    return true;
  }
  const isGroupHidden: unknown = getIn(hidden, `${fieldPath}.this`);
  if (isFieldPathHidden(isGroupHidden, values)) {
    return true;
  }

  const path = parentPath(fieldPath);

  if (path === fieldPath) {
    return false;
  }

  return isHidden(path, hidden, values);
};

export const removeHidden = <T extends FormValues>(
  fieldValue: unknown,
  values: T,
  hide: Hideable<Partial<T>, Partial<T>>,
  path?: string,
): T => {
  const source = isObject(fieldValue) ? fieldValue : {};
  const entries = Object.entries(source)
    .filter(([key]) =>
      path
        ? !isHidden(`${path}.${key}`, hide, values)
        : !isHidden(key, hide, values),
    )
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const newValues: unknown[] = [];
        (value as unknown[]).forEach((item) => {
          if (isObject(item)) {
            newValues.push(removeHidden(item, values, hide, key));
          } else {
            newValues.push(item);
          }
        });
        return [key, newValues] as const;
      }

      return [
        key,
        isObject(value) ? removeHidden(value, values, hide, key) : value,
      ] as const;
    });

  return Object.fromEntries(entries) as T;
};

const toFormErrors = <T, TValues>(
  yupError: ValidationError,
  hidden: Hideable<Partial<T>, Partial<TValues>>,
  values: TValues,
): FormErrors<TValues> => {
  let errors: FormErrors<TValues> = {};
  const inner = getInnerErrors(yupError);
  if (inner) {
    if (
      inner.length === 0 &&
      yupError.path &&
      !isHidden(yupError.path, hidden, values)
    ) {
      errors = setIn(errors, yupError.path, yupError.message);
    } else if (inner.length > 0) {
      inner.forEach((err) => {
        if (
          err.path &&
          !getIn(errors, err.path) &&
          !isHidden(err.path, hidden, values)
        ) {
          errors = setIn(errors, err.path, err.message);
        }
      });
    }
  }
  return errors;
};

export const validateForm =
  <T, TValues>(
    schema: ValidationSchema | undefined,
    hidden: Hideable<Partial<T>, Partial<TValues>>,
  ) =>
  async (values: TValues) => {
    let errors: FormErrors<TValues> = {};
    if (schema !== undefined) {
      try {
        await schema.validate(values, {
          abortEarly: false,
          context: values,
        });
      } catch (error) {
        if ((error as Error).name !== 'ValidationError') {
          throw error;
        }
        const yupError = error as ValidationError;
        errors = toFormErrors(yupError, hidden, values);
      }
    }
    return errors;
  };

/**
 * The payload the wizard sends: hidden fields stripped, then empty values
 * dropped. Shared by the form shells so both submit the same shape.
 */
export const normalizeSubmitValues = <T extends FormValues>(
  values: T,
  hidden: Hideable<Partial<T>, Partial<T>>,
): T => removeEmptyKeys(removeHidden(values, values, hidden));
