import type React from 'react';
import { Button } from 'react-bootstrap';
import PrimaryButton from '../../Buttons/PrimaryButton';

interface BranchSelectorButtonsProps {
  showCloseButton: boolean;
  onClose: () => void;
  onSave: () => void;
}

const BranchSelectorButtons = (
  props: Readonly<BranchSelectorButtonsProps>,
): React.JSX.Element => {
  const { showCloseButton, onClose, onSave } = props;
  return (
    <div className='d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
      {showCloseButton && (
        <Button
          data-testid='exit-portal-button'
          onClick={onClose}
          variant='tertiary'
          className='me-md-auto order-2 order-md-0'
        >
          {/* Fix 10 — S6772: JSX spacing fix for icon followed by text */}
          <i className='icon-close me-1' aria-hidden='true' />
          {' Cancel'}
        </Button>
      )}
      <PrimaryButton
        data-testid='save-button'
        onClick={onSave}
        className='ms-md-auto'
      >
        Save and continue
      </PrimaryButton>
    </div>
  );
};

export default BranchSelectorButtons;
