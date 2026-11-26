import type { ReactNode } from 'react';

export interface RhfRadioButtonProps<T = unknown> {
  label: string;
  value: T;
  descriptor?: ReactNode;
  disabled?: boolean | undefined;
  id: string;
  name: string;
  subFormField?: ReactNode;
  /** Side effect run after the field value has been set to `value`. */
  onChange?: ((value: T) => void) | undefined;
}
