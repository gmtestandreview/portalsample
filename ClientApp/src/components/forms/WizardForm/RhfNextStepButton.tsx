import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { orIfEmpty } from '../../../utils/orIfEmpty';
import PrimaryButton from '../../Buttons/PrimaryButton';
import ConfirmationModal from '../../modals/ConfirmationModal';
import { useRhfFormApi } from '../RhfForm/rhfFormApiContext';
import type { ModalProps } from '../types';

const RhfNextStepButton = ({
  finalStep,
  title,
  confirmation,
}: Readonly<{
  finalStep: boolean;
  title?: string;
  confirmation?: ModalProps;
}>) => {
  const [showModal, setShowModal] = useState(false);
  const { trigger } = useFormContext();
  const { submit } = useRhfFormApi();
  const label = orIfEmpty(title, finalStep ? 'Submit' : 'Save and next');

  if (!confirmation) {
    return (
      <PrimaryButton
        type='submit'
        data-testid='save-and-next-button'
        className='ms-md-auto'
      >
        {label}
      </PrimaryButton>
    );
  }

  const openConfirmation = async () => {
    if (await trigger()) {
      setShowModal(true);
    } else {
      await submit('next');
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showModal}
        closeModal={() => {
          setShowModal(false);
        }}
        onModalNo={() => {
          // Closing the dialogue is the only action on decline.
        }}
        onModalYes={() => {
          void submit('next');
        }}
        titleText={confirmation.modalTitle ?? confirmation.titleText ?? ''}
        bodyText={confirmation.modalBodyText ?? confirmation.bodyText ?? ''}
        noButtonTitle={confirmation.noButtonTitle ?? 'No'}
        yesButtonTitle={confirmation.yesButtonTitle ?? 'Yes'}
      />
      <PrimaryButton
        type='button'
        data-testid='save-and-next-button'
        onClick={() => {
          void openConfirmation();
        }}
        className='ms-md-auto'
      >
        {label}
      </PrimaryButton>
    </>
  );
};

export default RhfNextStepButton;
