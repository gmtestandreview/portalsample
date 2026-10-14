type FlatErrors = Record<string, string>;

const isFieldError = (
  value: object
): value is { type: string; message?: unknown } =>
  'type' in value && typeof value.type === 'string';

/**
 * Flattens RHF `formState.errors` to `path -> message`.
 *
 * A RHF field error is `{ type, message, ref }` where `ref` is a live DOM node.
 * A leaf is read for its message only: its other keys are never visited, so the
 * `ref` cannot reach `sanitizeErrorData`, a log line, a snapshot or a payload.
 * Nested objects and arrays recurse, giving the same dotted paths Formik's
 * errors produce (`contacts.0.firstName`).
 */
export const flattenRhfErrors = (
  errors: unknown,
  prefix = '',
  result: FlatErrors = {}
): FlatErrors => {
  if (errors === null || typeof errors !== 'object') {
    return result;
  }

  Object.entries(errors).forEach(([key, value]) => {
    if (value === null || typeof value !== 'object') {
      return;
    }
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (isFieldError(value)) {
      if (typeof value.message === 'string' && value.message !== '') {
        result[path] = value.message;
      }
      return;
    }
    flattenRhfErrors(value, path, result);
  });

  return result;
};
