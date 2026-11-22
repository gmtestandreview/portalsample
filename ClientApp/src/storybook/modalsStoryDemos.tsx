import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import BranchSelectorModal from '../components/modals/BranchSelectorModal';
import RFQDeleteModal from '../components/modals/RFQDeleteModal';
import {
  ModalDispatchCtx,
  ModalStateCtx,
} from '../components/modals/ModalContext';
import type {
  ModalDispatch,
  ModalState,
} from '../components/modals/ModalContext';
import { BranchSelectionModalMode } from '../components/modals/BranchSelectorModal/enums';
import { observed } from './modalsStoryHelpers';

// Mirrors PreConditions: owns ModalState, mounts the modal only while it is shown
// and provides a real trigger so focus restoration can be observed.
const ModalHost = ({
  triggerLabel,
  openModal,
  children,
}: {
  triggerLabel: string;
  openModal: (dispatch: ModalDispatch) => void;
  children: (state: ModalState) => ReactNode;
}) => {
  const [state, setState] = useState<ModalState>({
    showBranchSelector: false,
    showRFQDeleteModal: false,
    branchSelectionModalMode: BranchSelectionModalMode.SelectAndEditOrg,
  });
  const dispatch = useMemo<ModalDispatch>(
    () => ({
      setShowBranchSelector: (show) => {
        observed.current.branchSelectorVisibility.push(show);
        setState((prev) => ({ ...prev, showBranchSelector: show }));
      },
      setShowRFQDeleteModal: (show, rfqId) => {
        observed.current.rfqDeleteVisibility.push([show, rfqId]);
        setState((prev) => ({ ...prev, showRFQDeleteModal: show, rfqId }));
      },
      setShowRFQSelectModal: () => undefined,
    }),
    [],
  );

  return (
    <ModalStateCtx.Provider value={state}>
      <ModalDispatchCtx.Provider value={dispatch}>
        <Button
          onClick={() => {
            openModal(dispatch);
          }}
        >
          {triggerLabel}
        </Button>
        {children(state)}
      </ModalDispatchCtx.Provider>
    </ModalStateCtx.Provider>
  );
};

export const DeleteConfirmationDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open confirmation
      </Button>
      <ConfirmationModal
        isOpen={open}
        closeModal={() => {
          setOpen(false);
        }}
        onModalYes={() => {
          setOpen(false);
        }}
        onModalNo={() => {
          setOpen(false);
        }}
        titleText='Delete this request?'
        bodyText='Are you sure you want to delete this draft request? This action cannot be undone.'
        noButtonTitle='Cancel'
        yesButtonTitle='Yes, delete'
      />
    </div>
  );
};

export const SaveAndExitDemo = () => {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState('No choice made');
  return (
    <div>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open confirmation modal
      </Button>
      <output>{outcome}</output>
      <ConfirmationModal
        isOpen={open}
        closeModal={() => {
          setOpen(false);
        }}
        onModalYes={() => {
          setOutcome('Saved draft and exited');
        }}
        onModalNo={() => {
          setOutcome('Chose to continue editing');
        }}
        titleText='Save and exit?'
        bodyText='Your changes will be saved as a draft. You can continue editing from the dashboard.'
        noButtonTitle='Continue editing'
        yesButtonTitle='Save and exit'
      />
    </div>
  );
};

export const BranchSelectorHost = () => (
  <ModalHost
    triggerLabel='Manage branch or location'
    openModal={(dispatch) => {
      dispatch.setShowBranchSelector(true);
    }}
  >
    {(state) => (state.showBranchSelector ? <BranchSelectorModal /> : null)}
  </ModalHost>
);

export const RfqDeleteHost = () => (
  <ModalHost
    triggerLabel='Delete draft request'
    openModal={(dispatch) => {
      dispatch.setShowRFQDeleteModal(true, 'RFQ-2024-001234');
    }}
  >
    {(state) => (state.showRFQDeleteModal ? <RFQDeleteModal /> : null)}
  </ModalHost>
);
