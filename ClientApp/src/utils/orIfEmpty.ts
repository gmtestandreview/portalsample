/**
 * `value` unless it is missing or an empty string, in which case `fallback`.
 *
 * This is deliberately not `value ?? fallback`: an empty string is a value
 * that must also be replaced (an empty `id` attribute is invalid HTML, an
 * empty prefix should fall back to the prepend text). Naming the rule keeps
 * the intent explicit instead of relying on `||` truthiness.
 */
export const orIfEmpty = <T>(
  value: string | null | undefined,
  fallback: T,
): string | T =>
  value === undefined || value === null || value === '' ? fallback : value;
