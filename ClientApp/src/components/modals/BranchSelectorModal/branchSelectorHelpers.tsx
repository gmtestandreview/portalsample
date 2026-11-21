import type React from 'react';
import { Row, Col } from 'react-bootstrap';
import type {
  useAccountState,
  useAccountDispatch,
} from '../../../authentication/hooks';
import NotificationMessage from '../../Alert/NotificationMessage';
import {
  clearBranchModalNotification,
  getBranchModalNotification,
} from '../../../storage/notification';

export type SortableBranchKey =
  | 'abn'
  | 'branchOrLocationName'
  | 'businessListName'
  | 'businessOrTradingName'
  | 'crmGuid'
  | 'name';

export const showBranchModalMessage = (message: React.JSX.Element | null) => (
  <>
    {message && (
      <Row className='mb-4'>
        <Col>{message}</Col>
      </Row>
    )}
  </>
);

export const setNotification = () => {
  const branchModalNotification = getBranchModalNotification();
  return branchModalNotification ? (
    <NotificationMessage
      id='notif-message-1'
      canClose
      onClose={clearBranchModalNotification}
      {...branchModalNotification}
    />
  ) : null;
};

export const hasDefaultOrganisationId = (
  defaultOrganisationId?: number | null,
) => defaultOrganisationId != null;

export const toSortableText = (value: string | undefined) =>
  value?.toLowerCase() ?? '';

// Fix 11 — S3776: Module-scope helper 1
export const applyAccountDispatchUpdates = (
  accountDispatch: ReturnType<typeof useAccountDispatch>,
  selectedBranch: number | undefined,
  selectedCRMGuid: string | undefined,
  selectedOrganisation: string | undefined,
  selectedTradingName: string | undefined,
  selectedBranchName: string | undefined,
) => {
  if (!accountDispatch) return;
  accountDispatch.setDefaultOrganisationId(selectedBranch, selectedCRMGuid);
  if (selectedOrganisation !== undefined) {
    accountDispatch.setOrganisationAndBranch(
      selectedOrganisation,
      selectedTradingName ?? '',
      selectedBranchName ?? '',
    );
  }
};

// Fix 11 — S3776: Module-scope helper 2 (Fix 6 absorbed here)
export const finaliseAccountCreation = (
  accountState: ReturnType<typeof useAccountState>,
  accountDispatch: ReturnType<typeof useAccountDispatch>,
  selectedBranch: number | undefined,
  selectedCRMGuid: string | undefined,
  selectedOrganisation: string | undefined,
  selectedABN: string | undefined,
) => {
  const accountCreationIncomplete =
    !accountState?.details?.accountCreationCompleted;
  if (accountCreationIncomplete) {
    accountDispatch?.setCompleted();
    accountDispatch?.setDefaultOrganisationId(selectedBranch, selectedCRMGuid);
    accountDispatch?.setTargetOrganisation(
      selectedOrganisation ?? '',
      selectedABN ?? '',
    );
  }
};
