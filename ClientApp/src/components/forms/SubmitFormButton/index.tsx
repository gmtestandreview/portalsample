import { useField, useFormikContext } from 'formik';
import type React from 'react';
import { useEffect } from 'react';
import IntentButton from '../IntentButton';
import type { IntentButtonChildren } from '../IntentButton';
import { useIsRhfShell, useRhfFormApi } from '../RhfForm';
import { omitUndefined } from '../../../utils/omitUndefined';

interface SubmitFormButtonProps {
  children?: IntentButtonChildren;
}

const FormikSubmitFormButton = ({
  children,
}: Readonly<SubmitFormButtonProps>) => {
  const { submitForm } = useFormikContext();
  const [, , saveAndExitHelper] = useField<boolean | undefined>('saveAndExit');
  const [submitClickField, , submitClickHelper] = useField<boolean | undefined>(
    'submitClick',
  );

  useEffect(() => {
    if (submitClickField.value === true) {
      void submitForm();
      void submitClickHelper.setValue(false);
    }
  }, [submitClickField, submitForm, submitClickHelper]);

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    void submitClickHelper.setValue(true);
    void saveAndExitHelper.setValue(false);
  };

  return (
    <IntentButton
      testId='submit-button'
      label='Submit'
      className='me-3'
      onClick={onClick}
      {...omitUndefined({ children })}
    />
  );
};

const RhfSubmitFormButton = ({ children }: Readonly<SubmitFormButtonProps>) => {
  const { submit } = useRhfFormApi();

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    void submit('next');
  };

  return (
    <IntentButton
      testId='submit-button'
      label='Submit'
      className='me-3'
      onClick={onClick}
      {...omitUndefined({ children })}
    />
  );
};

const SubmitFormButton = (props: Readonly<SubmitFormButtonProps>) =>
  useIsRhfShell() ? (
    <RhfSubmitFormButton {...props} />
  ) : (
    <FormikSubmitFormButton {...props} />
  );

export default SubmitFormButton;
