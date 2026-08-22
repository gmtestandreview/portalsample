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
    setShowRFQSelectModal: (show: boolean, rfqId: string, callingPath: string) => void;
}

export const ModalStateCtx = createContext<ModalState | null>(null);
export const ModalDispatchCtx = createContext<ModalDispatch | null>(null);

export const useModalState = () => useContext(ModalStateCtx);
export const useModalDispatch = () => useContext(ModalDispatchCtx);
