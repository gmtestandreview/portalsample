import { useFormContext, useFormState } from 'react-hook-form';
import UnsavedChangesPrompt from './UnsavedChangesPrompt';

/**
 * RHF adapter for the unsaved-changes prompt.
 *
 * `isValid` is computed by the resolver over the whole form, not read from the
 * errors object as Formik does, so `clearErrors()` on confirm does not change
 * it. That is safe: confirming proceeds with the navigation, and a reload of the
 * step resets the form (and its submit count).
 */
const RhfUnsavedFormPrompt = ({ path }: Readonly<{ path?: string }>) => {
  const { clearErrors } = useFormContext();
  const { isDirty, isValid, submitCount } = useFormState();

  return (
    <UnsavedChangesPrompt
      path={path}
      isDirty={isDirty}
      isValid={isValid}
      submitCount={submitCount}
      onProceed={() => clearErrors()}
    />
  );
};

export default RhfUnsavedFormPrompt;
