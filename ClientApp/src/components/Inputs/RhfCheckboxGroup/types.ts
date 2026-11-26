import type { ReactNode } from 'react';

export interface RhfCheckboxOption<T> {
  value: T;
  label: string;
  id?: string | undefined;
  disabled?: boolean | undefined;
  descriptor?: ReactNode;
}

export interface RhfCheckboxGroupProps<T> {
  name: string;
  legend: string;
  id?: string | undefined;
  options: RhfCheckboxOption<T>[];
  isSummary?: boolean | undefined;
  displayHorizontally?: boolean | undefined;
  inlineHelp?: string | undefined;
  inlineHelpTitle?: string | undefined;
  containerClassName?: string | undefined;
  legendClassName?: string | undefined;
  className?: string | undefined;
  /** Hides the group level validation message (used when a parent shows it). */
  supressFieldLevelMessages?: boolean | undefined;
  /** Side effect run after the selected values have been updated. */
  onChange?: ((selected: T[]) => void) | undefined;
}
