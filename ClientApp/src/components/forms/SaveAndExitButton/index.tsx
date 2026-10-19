import { useField, useFormikContext } from 'formik';
import type React from 'react';
import { useEffect } from 'react';
import IntentButton from '../IntentButton';
import type { IntentButtonChildren } from '../IntentButton';
import { useIsRhfShell, useRhfFormApi } from '../RhfForm';

interface SaveAndExitButtonProps {
  children?: IntentButtonChildren;
}

const FormikSaveAndExitButton = ({
  children,
}: Readonly<SaveAndExitButtonProps>) => {
  const { submitForm } = useFormikContext();
  const [_field, _meta, saveAndExitHelper] = useField<boolean | undefined>(
    'saveAndExit'
  );
  const [saveAndExitClickField, _m, saveAndExitClickHelper] = useField<
    boolean | undefined
  >('saveAndExitClick');

  useEffect(() => {
    if (saveAndExitClickField.value === true) {
      submitForm();
      saveAndExitClickHelper.setValue(false);
    }
  }, [saveAndExitClickField, submitForm, saveAndExitClickHelper]);

  const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    saveAndExitClickHelper.setValue(true);
    saveAndExitHelper.setValue(true);
  };

  return (
    <IntentButton
      testId='save-and-exit-button'
      label='Save and exit'
      className='me-md-3'
      mode='dark'
      onClick={onClick}
    >
      {children}
    </IntentButton>
  );
};

const RhfSaveAndExitButton = ({
  children,
}: Readonly<SaveAndExitButtonProps>) => {
  const { submit } = useRhfFormApi();

  // The mode goes to the shell for this one submit; it is never written to the
  // form values, so it cannot stay set after a failed save.
  const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    void submit('saveAndExit');
  };

  return (
    <IntentButton
      testId='save-and-exit-button'
      label='Save and exit'
      className='me-md-3'
      mode='dark'
      onClick={onClick}
    >
      {children}
    </IntentButton>
  );
};

const SaveAndExitButton = (props: Readonly<SaveAndExitButtonProps>) =>
  useIsRhfShell() ? (
    <RhfSaveAndExitButton {...props} />
  ) : (
    <FormikSaveAndExitButton {...props} />
  );

export default SaveAndExitButton;
