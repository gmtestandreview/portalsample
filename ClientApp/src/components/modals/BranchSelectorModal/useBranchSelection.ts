import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAccountState } from '../../../authentication/hooks';
import { OrganisationsClient } from '../../../api/web-api-client';
import type { OrganisationDto } from '../../../api/web-api-client';
import { silentRequestFor } from '../../../authentication/silentRequest';
import AppLogger from '../../../instrumentation/AppLogger';
import {
  hasDefaultOrganisationId,
  toSortableText,
} from './branchSelectorHelpers';
import type { SortableBranchKey } from './branchSelectorHelpers';

/**
 * Owns the branch list, the current selection, sort state and the initial
 * branch load for the BranchSelectorModal.
 */
export const useBranchSelection = () => {
  const { accounts, instance } = useMsal();
  const accountState = useAccountState();
  const [isModalDataLoading, setIsModalDataLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>();
  const [selectedOrganisation, setSelectedOrganisation] = useState<
    string | undefined
  >();
  const [selectedTradingName, setSelectedTradingName] = useState<
    string | undefined
  >();
  const [selectedBranchName, setSelectedBranchName] = useState<
    string | undefined
  >();
  const [selectedABN, setSelectedABN] = useState<string | undefined>();
  const [selectedCRMGuid, setSelectedCRMGuid] = useState<string | undefined>();
  const [branches, setBranches] = useState<OrganisationDto[] | undefined>();
  const [sortConfig, setSortConfig] = useState<{
    key: SortableBranchKey | null;
    direction: 'asc' | 'desc';
  }>({ key: 'branchOrLocationName', direction: 'asc' });

  const handleChange = (
    _event: ChangeEvent<HTMLInputElement>,
    branchId: number | undefined,
    organisationName: string | undefined,
    tradingName: string | undefined,
    branchName: string | undefined,
    abn: string | undefined,
    crmGuid: string | undefined,
  ) => {
    setSelectedBranch(branchId);
    setSelectedOrganisation(organisationName);
    setSelectedTradingName(tradingName);
    setSelectedBranchName(branchName);
    setSelectedABN(abn);
    setSelectedCRMGuid(crmGuid);
  };

  useEffect(() => {
    let isActive = true;

    const loadBranches = async () => {
      // Fix 5 — S6582: Optional chain collapse
      if (accountState?.details?.abn) {
        const client = new OrganisationsClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        client.setAuthToken(tokenResult.accessToken);

        try {
          setIsModalDataLoading(true); // Modal data
          const result = await client.getOrganisationsByABN(
            accountState.details.abn,
            true,
          );
          if (!isActive) return;

          // The generated client resolves an empty 200 body to null despite its
          // OrganisationDto[] signature, and rendering null branches would throw.
          const loaded = result as OrganisationDto[] | null;
          setBranches(loaded ?? []);
          const firstBranch = loaded?.[0];
          if (!firstBranch) {
            throw new Error('No branches returned for organisation');
          }
          if (
            hasDefaultOrganisationId(accountState.details.defaultOrganisationId)
          ) {
            setSelectedBranch(accountState.details.defaultOrganisationId);
            setSelectedCRMGuid(accountState.details.organisationCRMGuid);
            setSelectedTradingName(accountState.details.trading);
            setSelectedBranchName(accountState.details.branch);
          } else {
            setSelectedBranch(firstBranch.organisationId);
            setSelectedTradingName(firstBranch.businessOrTradingName);
            setSelectedBranchName(firstBranch.branchOrLocationName);
            setSelectedABN(firstBranch.abn);
            setSelectedCRMGuid(firstBranch.crmGuid);
          }
          setSelectedOrganisation(firstBranch.name);
        } catch (error) {
          if (!isActive) return;

          AppLogger.error('Failed to load branches', error as Error);
          setHasLoadError(true);
        } finally {
          if (isActive) {
            setIsModalDataLoading(false);
          }
        }
      }
    };

    void loadBranches();

    return () => {
      isActive = false;
    };
  }, [
    accountState,
    accounts,
    instance,
    accountState?.details?.defaultOrganisationId,
  ]);

  const sortData = (key: SortableBranchKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sorted = branches?.slice();
    sorted?.sort((a, b) => {
      const aValue = toSortableText(Reflect.get(a, key));
      const bValue = toSortableText(Reflect.get(b, key));

      const comparison = aValue.localeCompare(bValue);
      return direction === 'asc' ? comparison : -comparison;
    });

    setBranches(sorted);
    setSortConfig({ key, direction });
  };

  return {
    isModalDataLoading,
    hasLoadError,
    branches,
    sortConfig,
    sortData,
    handleChange,
    selectedBranch,
    selectedOrganisation,
    selectedTradingName,
    selectedBranchName,
    selectedABN,
    selectedCRMGuid,
  };
};
