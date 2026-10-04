import type { SelectInputOption } from '../SelectInput/types';

/**
 * Props for the vertical, label-above select. The legacy `SelectInput` extras
 * (`displayHorizontally`, `inlineHelp`, `readOnly`) are added with their first
 * RHF consumer, not before.
 */
export interface RhfSelectInputProps<T extends string | number = string> {
  label: string;
  options?: SelectInputOption<T>[];
  /** Value of the blank option when `addBlank` is set. */
  defaultValue?: T | '';
  defaultDisplayText?: string;
  className?: string;
  containerClassName?: string;
  name: string;
  id?: string;
  disabled?: boolean;
  /** Side effect run after the field value has been updated. */
  onChange?: (value: T | '') => void;
  isSummary?: boolean | undefined;
  addBlank?: boolean;
}
