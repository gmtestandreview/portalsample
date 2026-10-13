import { useController } from 'react-hook-form';
import type { FieldValues, UseControllerProps } from 'react-hook-form';
import type { ReactNode } from 'react';
import { omitUndefined } from '../../utils/omitUndefined';

// Deliberately non-generic: `FieldValues` is `Record<string, any>`, so `validate`
// callbacks receive `any`. Tightening that to `unknown` breaks typed consumer
// callbacks under strictFunctionTypes, and making the hook generic touches
// every input.
export type RhfRules = UseControllerProps<FieldValues>['rules'];

interface UseRhfFieldA11yOptions {
  name: string;
  id?: string | undefined;
  inlineHelp?: ReactNode;
  supressFieldLevelMessages?: boolean | undefined;
  rules?: RhfRules;
}

/**
 * Shared wiring for the React Hook Form inputs: the controller, the element
 * ids, the validation message (shown only once the field is touched or the form
 * has been submitted, and never when field level messages are suppressed), and
 * the `aria-describedby` value joining the help and validation message ids.
 */
export const useRhfFieldA11y = ({
  name,
  id,
  inlineHelp,
  supressFieldLevelMessages,
  rules,
}: UseRhfFieldA11yOptions) => {
  const { field, fieldState, formState } = useController({
    name,
    ...omitUndefined({ rules }),
  });
  const controlId = id || name;
  const helpId = inlineHelp ? `help-${controlId}` : undefined;
  const validationMessageId = `${controlId}-validation-msg`;
  const errorMessage =
    !supressFieldLevelMessages &&
    (fieldState.isTouched || formState.isSubmitted)
      ? fieldState.error?.message
      : undefined;
  const describedBy =
    [helpId, errorMessage ? validationMessageId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return {
    field,
    controlId,
    helpId,
    validationMessageId,
    errorMessage,
    describedBy,
  };
};
