import type { ChangeEventHandler, ReactNode } from 'react';

export interface RadioButtonProps<T = unknown> {
  label: string;
  value: T;
  descriptor?: ReactNode | undefined;
  disabled?: boolean | undefined;
  id: string;
  name?: string;
  subFormField?: ReactNode | undefined;
  onChange?: ChangeEventHandler<any> | undefined;
  [key: string]: unknown;
}
