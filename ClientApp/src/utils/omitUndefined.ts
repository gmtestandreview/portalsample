/**
 * Drops keys whose value is `undefined`.
 *
 * With `exactOptionalPropertyTypes`, an optional property means "absent", not "present and
 * undefined". View-model shapes that read from optional chains carry explicit `undefined`s, and
 * this is where they are converted to the absent-key shape the generated DTOs require.
 */
export const omitUndefined = <T extends object>(
  value: T
): { [K in keyof T]?: Exclude<T[K], undefined> } =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
