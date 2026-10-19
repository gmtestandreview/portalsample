import { useFormikContext } from 'formik';
import UnsavedChangesPrompt from './UnsavedChangesPrompt';

const UnsavedFormPrompt = ({ path }: Readonly<{ path?: string }>) => {
  const formik = useFormikContext();

  return (
    <UnsavedChangesPrompt
      path={path}
      isDirty={formik.dirty}
      isValid={formik.isValid}
      submitCount={formik.submitCount}
      onProceed={() => formik.setErrors({})}
    />
  );
};

export default UnsavedFormPrompt;
