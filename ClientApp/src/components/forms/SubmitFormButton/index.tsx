import { useField, useFormikContext } from 'formik';
import type React from 'react';
import { useEffect } from 'react';
import IntentButton from '../IntentButton';
import type { IntentButtonChildren } from '../IntentButton';
import { useIsRhfShell, useRhfFormApi } from '../RhfForm';

interface SubmitFormButtonProps {
  children?: IntentButtonChildren;
}

const FormikSubmitFormButton = ({
  children,
}: Readonly<SubmitFormButtonProps>) => {
  const { submitForm } = useFormikContext();
  const [_field, _meta, saveAndExitHelper] = useField<boolean | undefined>(
    'saveAndExit'
  );
  const [submitClickField, _m, submitClickHelper] = useField<
    boolean | undefined
  >('submitClick');

  useEffect(() => {
    if (submitClickField.value === true) {
      submitForm();
      submitClickHelper.setValue(false);
    }
  }, [submitClickField, submitForm, submitClickHelper]);

  const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    submitClickHelper.setValue(true);
    saveAndExitHelper.setValue(false);
  };

  return (
    <IntentButton
      testId='submit-button'
      label='Submit'
      className='me-3'
      onClick={onClick}
    >
      {children}
    </IntentButton>
  );
};

const RhfSubmitFormButton = ({ children }: Readonly<SubmitFormButtonProps>) => {
  const { submit } = useRhfFormApi();

  const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    void submit('next');
  };

  return (
    <IntentButton
      testId='submit-button'
      label='Submit'
      className='me-3'
      onClick={onClick}
    >
      {children}
    </IntentButton>
  );
};

const SubmitFormButton = (props: Readonly<SubmitFormButtonProps>) =>
  useIsRhfShell() ? (
    <RhfSubmitFormButton {...props} />
  ) : (
    <FormikSubmitFormButton {...props} />
  );

export default SubmitFormButton;
