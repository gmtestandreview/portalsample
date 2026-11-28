import { useFormContext, useFormState } from 'react-hook-form';
import UnsavedChangesPrompt from './UnsavedChangesPrompt';

/**
 * RHF adapter for the unsaved-changes prompt.
 *
 * `isValid` is computed by the resolver over the whole form, not read from the
 * errors object, so `clearErrors()` on confirm does not change
 * it. That is safe: confirming proceeds with the navigation, and a reload of the
 * step resets the form (and its submit count).
 */
const RhfUnsavedFormPrompt = ({ path }: Readonly<{ path?: string }>) => {
  const { clearErrors } = useFormContext();
  const { isDirty, isSubmitting, isValid, submitCount } = useFormState();

  return (
    <UnsavedChangesPrompt
      path={path}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      isValid={isValid}
      submitCount={submitCount}
      onProceed={() => {
        clearErrors();
      }}
    />
  );
};

export default RhfUnsavedFormPrompt;
