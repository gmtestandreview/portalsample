import type { Hideable } from '../../components/forms/types';

/** Hidden rules handed to the RHF fields when Formik's `status.hidden` is unset. */
export const NO_HIDDEN_RULES: Hideable = {};

/** Leaf paths of the contact block shared by the steps that edit a contact. */
export const CONTACT_TOUCH_PATHS = [
  'contact.title',
  'contact.titleOther',
  'contact.firstName',
  'contact.lastName',
  'contact.role',
  'contact.phone',
  'contact.mobile',
  'contact.email',
] as const;

/** Leaf paths of an address block stored under `prefix`. */
export const addressTouchPaths = <Prefix extends string>(prefix: Prefix) =>
  [
    `${prefix}.line1`,
    `${prefix}.line2`,
    `${prefix}.line3`,
    `${prefix}.suburb`,
    `${prefix}.postcode`,
    `${prefix}.state`,
    `${prefix}.searchText`,
  ] as const;

interface BridgedNameOptions {
  /** Field names mirrored exactly. */
  names: readonly string[];
  /** Prefixes (including the trailing dot) whose every sub-path is mirrored. */
  prefixes?: readonly string[];
}

/** Builds the `isBridgedName` predicate from exact names and path prefixes. */
export const createBridgedNamePredicate = ({
  names,
  prefixes = [],
}: BridgedNameOptions) => {
  const exactNames: ReadonlySet<string> = new Set(names);
  return (name: string) =>
    exactNames.has(name) || prefixes.some((prefix) => name.startsWith(prefix));
};
