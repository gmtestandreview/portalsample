import type { ReactNode } from 'react';

/**
 * Props for the React Hook Form text box. The legacy `TextInput` extras
 * (`type`, the ARIA combobox attributes, pointer and key handlers) are added
 * with their first RHF consumer, not before.
 */
export interface RhfTextInputProps {
  label: string;
  name: string;
  inlineHelp?: ReactNode;
  inlineHelpTitle?: string | undefined;
  disabled?: boolean | undefined;
  readonly?: boolean | undefined;
  id?: string | undefined;
  autoComplete?: string | undefined;
  placeholder?: string | undefined;
  containerClassName?: string | undefined;
  className?: string | undefined;
  isSummary?: boolean | undefined;
  /** Side effect run after the field value has been updated. */
  onChange?: ((value: string) => void) | undefined;
  /** Side effect run when the field loses focus, before the value is trimmed. */
  onBlur?: (() => void) | undefined;
}
