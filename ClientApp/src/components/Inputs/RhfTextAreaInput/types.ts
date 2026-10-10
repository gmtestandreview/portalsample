import type { ReactNode } from 'react';

/**
 * Props for the React Hook Form multi-line text box. Everything the legacy
 * `TextAreaInput` accepts that its first consumers use is supported here.
 * `readonly`, `autoComplete`, and `onChange`/`onBlur` side-effect hooks are
 * not supported by the legacy component, so they are not added here either.
 */
export interface RhfTextAreaInputProps {
  label: string;
  name: string;
  inlineHelp?: ReactNode;
  disabled?: boolean | undefined;
  id?: string | undefined;
  rows?: number | undefined;
  placeholder?: string | undefined;
  maxCharacters?: number | undefined;
  containerClassName?: string | undefined;
  className?: string | undefined;
  supressFieldLevelMessages?: boolean | undefined;
  isSummary?: boolean | undefined;
}
