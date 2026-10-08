import type { ReactNode } from 'react';
export interface RhfRadioOption<T = unknown> {
  label: string;
  value: T;
  id: string;
  descriptor?: ReactNode;
  subFormField?: ReactNode;
  disabled?: boolean | undefined;
}

export interface RhfRadioButtonGroupProps<T = unknown> {
  displayHorizontally?: boolean | undefined;
  inlineHelp?: ReactNode;
  inlineHelpTitle?: ReactNode;
  options: RhfRadioOption<T>[];
  name: string;
  legend: string;
  id?: string | undefined;
  /** Side effect run after the field value has been updated. */
  onChange?: ((value: T) => void) | undefined;
  disabled?: boolean | undefined;
  isSummary?: boolean | undefined;
  containerClassName?: string | undefined;
  className?: string | undefined;
}
