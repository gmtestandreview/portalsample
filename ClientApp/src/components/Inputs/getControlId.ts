import { orIfEmpty } from '../../utils/orIfEmpty';

/**
 * The DOM id for a form control: an explicit `id` prop when one is supplied,
 * otherwise the field `name`.
 *
 * An empty string counts as "not supplied" because an empty `id` attribute is
 * invalid HTML. This is why the fallback is not a plain nullish check.
 */
export const getControlId = (id: string | undefined, name: string): string =>
  orIfEmpty(id, name);
