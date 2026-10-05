type WithoutUndefined<T extends object> = {
  [K in keyof T]?: Exclude<T[K], undefined>;
};

const isPlainObject = (value: object): boolean => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Drops own enumerable properties whose value is `undefined` from a plain object.
 *
 * With `exactOptionalPropertyTypes`, optional props and DTO fields that exclude `undefined`
 * require an absent key when no value is available. This adapter converts explicit `undefined`
 * values from optional chains into that absent-key shape.
 *
 * Always returns a new plain object, preserving falsy values, enumerable symbol keys and nested
 * references. Filtering is shallow and never mutates the input. The return type conservatively
 * makes every property optional.
 *
 * Accepts only objects whose prototype is this realm's `Object.prototype` or `null`. The generic
 * `object` constraint cannot express this runtime requirement.
 *
 * @throws {TypeError} For arrays, class instances and ordinary objects from other realms.
 */
export const omitUndefined = <T extends object>(
  value: T
): WithoutUndefined<T> => {
  if (!isPlainObject(value)) {
    throw new TypeError('omitUndefined accepts plain objects only');
  }

  const definedEntries = Reflect.ownKeys(value)
    .filter((key) => Object.prototype.propertyIsEnumerable.call(value, key))
    .map((key): [PropertyKey, unknown] => [key, Reflect.get(value, key)])
    .filter(([, entry]) => entry !== undefined);

  // TypeScript cannot express enumerable own-key filtering for a generic object type.
  return Object.fromEntries(definedEntries) as WithoutUndefined<T>;
};
