import type React from 'react';
import IntentButton from '../IntentButton';
import type { IntentButtonChildren } from '../IntentButton';
import { useRhfFormApi } from '../RhfForm/rhfFormApiContext';
import { omitUndefined } from '../../../utils/omitUndefined';

interface SubmitFormButtonProps {
  children?: IntentButtonChildren;
}

const SubmitFormButton = ({ children }: Readonly<SubmitFormButtonProps>) => {
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

export default SubmitFormButton;
