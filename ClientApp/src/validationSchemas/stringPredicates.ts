import isEmpty from 'lodash/isEmpty';
import trim from 'lodash/trim';

export const NotEmpty = (value: string | undefined | null) =>
  value !== undefined && value !== null && !isEmpty(trim(value));

export const IsEmpty = (value: string | undefined | null) =>
  value === undefined || value === null || isEmpty(trim(value));
