import { isObject } from '../formPath';

const countOfErrors = (value: unknown): number => {
  let count = 0;
  if (isObject(value)) {
    const keys = Object.keys(value);
    count = keys.length;
  }

  return count;
};

export default countOfErrors;
