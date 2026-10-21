const isPlainObject = (value: object): value is Record<string, unknown> => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/** Compares the JSON-like values used by wizard forms, including Date values. */
export const areFormValuesEqual = (left: unknown, right: unknown): boolean => {
  if (
    left === right ||
    (typeof left === 'number' &&
      typeof right === 'number' &&
      Number.isNaN(left) &&
      Number.isNaN(right))
  ) {
    return true;
  }

  if (left instanceof Date || right instanceof Date) {
    if (!(left instanceof Date && right instanceof Date)) {
      return false;
    }

    const leftTime = left.getTime();
    const rightTime = right.getTime();
    return (
      leftTime === rightTime ||
      (Number.isNaN(leftTime) && Number.isNaN(rightTime))
    );
  }

  if (
    left === null ||
    right === null ||
    left === undefined ||
    right === undefined
  ) {
    return false;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => areFormValuesEqual(value, right[index]))
    );
  }

  if (
    typeof left !== 'object' ||
    typeof right !== 'object' ||
    !isPlainObject(left) ||
    !isPlainObject(right)
  ) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        areFormValuesEqual(left[key], right[key])
    )
  );
};
