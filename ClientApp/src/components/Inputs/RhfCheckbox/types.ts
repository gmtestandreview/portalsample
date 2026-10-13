import type { ReactNode } from 'react';

/**
 * Props for the single boolean checkbox. The legacy `Checkbox` extras (`value`
 * for array membership, `validationClassName`) are added with their first RHF
 * consumer, not before.
 */
export interface RhfCheckboxProps {
  label: string;
  name: string;
  id?: string | undefined;
  descriptor?: ReactNode;
  disabled?: boolean | undefined;
  inlineHelp?: ReactNode;
  supressFieldLevelMessages?: boolean | undefined;
  containerClassName?: string | undefined;
  className?: string | undefined;
  subFormField?: ReactNode;
  isSummary?: boolean | undefined;
  /** Side effect run after the field value has been updated. */
  onChange?: ((checked: boolean) => void) | undefined;
}
