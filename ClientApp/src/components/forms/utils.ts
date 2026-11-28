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
  inner?: ValidationError[];
}): ValidationError[] | undefined => error.inner;

export const isFieldPathHidden = (hidden: unknown, values: unknown): boolean =>
  hidden !== undefined &&
  (hidden === true ||
    (typeof hidden === 'function' &&
      (hidden as (currentValues: unknown) => boolean)(values)));

// Start index of a trailing `.name` or `[index]` segment, or -1 when the path
// has none. Scans with indexOf/lastIndexOf so it stays linear on long input.
const trailingSegmentStart = (path: string): number => {
  const last = path.length - 1;
  let start = -1;

  const dot = path.lastIndexOf('.');
  if (dot >= 0 && dot < last && !path.includes('[', dot + 1)) {
    start = dot;
  }

  if (path.endsWith(']')) {
    const bracket = path.indexOf('[', path.lastIndexOf(']', last - 1) + 1);
    if (bracket >= 0 && bracket < last - 1 && (start < 0 || bracket < start)) {
      start = bracket;
    }
  }

  return start;
};

const parentPath = (path: string): string => {
  const start = trailingSegmentStart(path);
  return start < 0 ? path : path.slice(0, start);
};

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

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Drops objects that are empty only because a control registered a field under
 * them. React Hook Form creates a parent object (for example `streetAddress`
 * or `form`) as soon as a nested field registers, even when no value was ever
 * loaded or typed; such parents stay absent. An empty object is kept
 * when the loaded values already had that path, so a saved `{}` round-trips.
 */
const removeUnloadedEmptyObjects = (
  values: Record<string, unknown>,
  loaded: unknown,
): Record<string, unknown> => {
  const loadedEntries = new Map(
    Object.entries(isPlainRecord(loaded) ? loaded : {}),
  );
  const entries = Object.entries(values).flatMap(([key, child]) => {
    if (!isPlainRecord(child)) {
      return [[key, child] as const];
    }
    const loadedChild = loadedEntries.get(key);
    const pruned = removeUnloadedEmptyObjects(child, loadedChild);
    return Object.keys(pruned).length === 0 && loadedChild === undefined
      ? []
      : [[key, pruned] as const];
  });
  return Object.fromEntries(entries);
};

/**
 * The payload the wizard sends: hidden fields stripped, then empty values
 * dropped, then empty objects that only registration created. Shared by the
 * form shells so both submit the same shape; `loaded` is the step's loaded
 * values.
 */
export const normalizeSubmitValues = <T extends FormValues>(
  values: T,
  hidden: Hideable<Partial<T>, Partial<T>>,
  loaded?: unknown,
): T =>
  removeUnloadedEmptyObjects(
    removeEmptyKeys(removeHidden(values, values, hidden)),
    loaded,
  ) as T;
