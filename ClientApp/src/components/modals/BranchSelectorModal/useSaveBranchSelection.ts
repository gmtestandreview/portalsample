import { useState } from 'react';
import { useNavigate } from 'react-router';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import {
  useAccountState,
  useAccountDispatch,
} from '../../../authentication/hooks';
import { useModalState, useModalDispatch } from '../ModalContext';
import { UsersClient } from '../../../api/web-api-client';
import { silentRequestFor } from '../../../authentication/silentRequest';
import { clearBranchModalNotification } from '../../../storage/notification';
import AppLogger from '../../../instrumentation/AppLogger';
import { BranchSelectionModalMode } from './enums';
import { omitUndefined } from '../../../utils/omitUndefined';
import {
  applyAccountDispatchUpdates,
  finaliseAccountCreation,
} from './branchSelectorHelpers';

interface BranchSelectionValues {
  selectedBranch: number | undefined;
  selectedOrganisation: string | undefined;
  selectedTradingName: string | undefined;
  selectedBranchName: string | undefined;
  selectedABN: string | undefined;
  selectedCRMGuid: string | undefined;
}

/**
 * Save/finalise flow for the BranchSelectorModal: persists the default
 * organisation, updates account state, then closes the modal and navigates
 * or reloads.
 */
export const useSaveBranchSelection = (
  selection: BranchSelectionValues,
  setSavingBranchSelectorError: (value: boolean) => void,
) => {
  const [isSaving, setIsSaving] = useState(false);
  const { inProgress, accounts, instance } = useMsal();
  const accountState = useAccountState();
  const accountDispatch = useAccountDispatch();
  const modalState = useModalState();
  const modalDispatch = useModalDispatch();
  const navigate = useNavigate();
  const branchSelectionModalMode = modalState?.branchSelectionModalMode;
  const {
    selectedBranch,
    selectedOrganisation,
    selectedTradingName,
    selectedBranchName,
    selectedABN,
    selectedCRMGuid,
  } = selection;

  const onContinueBranchSelectorModal = async () => {
    if (inProgress === InteractionStatus.None && accounts.length > 0) {
      setIsSaving(true);
      let reloadAfterSave = false;
      const client = new UsersClient();
      const tokenResult = await instance.acquireTokenSilent(
        silentRequestFor(accounts[0]),
      );
      client.setAuthToken(tokenResult.accessToken);
      try {
        if (
          branchSelectionModalMode === BranchSelectionModalMode.RFQSelectOrg
        ) {
          await client.setDefaultOrganisation(
            omitUndefined({
              defaultOrganisationId: selectedBranch,
              rfqId: modalState?.rfqId,
            }),
          );
        } else if (
          branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg
        ) {
          await client.setDefaultOrganisation(
            omitUndefined({ defaultOrganisationId: selectedBranch }),
          );
        }
        // Fix 11 — S3776: replaced inline accountDispatch guard with helper (Fix 4 absorbed)
        applyAccountDispatchUpdates(
          accountDispatch,
          selectedBranch,
          selectedCRMGuid,
          selectedOrganisation,
          selectedTradingName,
          selectedBranchName,
        );
        // Fix 11 — S3776: replaced inline accountCreationCompleted block with helper (Fix 6 absorbed)
        finaliseAccountCreation(
          accountState,
          accountDispatch,
          selectedBranch,
          selectedCRMGuid,
          selectedOrganisation,
          selectedABN,
        );
        reloadAfterSave =
          branchSelectionModalMode === BranchSelectionModalMode.RFQSelectOrg;
      } catch (error) {
        AppLogger.error('Failed to select organisation', error as Error);
        setSavingBranchSelectorError(true);
      } finally {
        setIsSaving(false);
        modalDispatch?.setShowBranchSelector(false);
        clearBranchModalNotification();
        if (reloadAfterSave) {
          globalThis.location.reload();
        } else {
          void navigate('/');
        }
      }
    }
  };

  return { isSaving, onContinueBranchSelectorModal };
};
