import type React from 'react';
import IntentButton from '../IntentButton';
import type { IntentButtonChildren } from '../IntentButton';
import { useRhfFormApi } from '../RhfForm/rhfFormApiContext';
import { omitUndefined } from '../../../utils/omitUndefined';

interface SaveAndExitButtonProps {
  children?: IntentButtonChildren;
}

const SaveAndExitButton = ({ children }: Readonly<SaveAndExitButtonProps>) => {
  const { submit } = useRhfFormApi();

  // The mode goes to the shell for this one submit; it is never written to the
  // form values, so it cannot stay set after a failed save.
  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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
      {...omitUndefined({ children })}
    />
  );
};

export default SaveAndExitButton;
