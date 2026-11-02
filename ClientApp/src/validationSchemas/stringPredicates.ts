export const NotEmpty = (value: string | undefined | null) =>
  (value?.trim() ?? '').length > 0;

export const IsEmpty = (value: string | undefined | null) =>
  (value?.trim() ?? '').length === 0;
