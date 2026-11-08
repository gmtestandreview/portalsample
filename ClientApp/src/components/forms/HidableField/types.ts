import type { ReactNode } from 'react';
import type { FormikValues } from 'formik';

export interface HidableFieldProps<T extends FormikValues = FormikValues> {
  name: string;
  children?: ReactNode | ((values: T) => ReactNode);
}
