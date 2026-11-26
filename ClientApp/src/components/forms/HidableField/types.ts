import type { ReactNode } from 'react';
import type { FormValues } from '../types';

export interface HidableFieldProps<T extends FormValues = FormValues> {
  name: string;
  children?: ReactNode | ((values: T) => ReactNode);
}
