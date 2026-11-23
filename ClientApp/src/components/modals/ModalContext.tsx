import { createContext, useContext } from 'react';

export interface ModalState {
  showBranchSelector: boolean;
  showRFQDeleteModal: boolean;
  branchSelectionModalMode?: string;
  callingPath?: string;
  rfqId?: string;
}

export interface ModalDispatch {
  setShowBranchSelector: (show: boolean) => void;
  setShowRFQDeleteModal: (show: boolean, rfqId: string) => void;
  setShowRFQSelectModal: (
    show: boolean,
    rfqId: string,
    callingPath: string,
  ) => void;
}

export const ModalStateContext = createContext<ModalState | null>(null);
export const ModalDispatchContext = createContext<ModalDispatch | null>(null);

export {
  ModalStateContext as ModalStateCtx,
  ModalDispatchContext as ModalDispatchCtx,
};

export const useModalState = () => useContext(ModalStateContext);
export const useModalDispatch = () => useContext(ModalDispatchContext);
