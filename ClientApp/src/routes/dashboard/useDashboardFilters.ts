import { useState, useEffect, useMemo, useRef } from 'react';
import { omitUndefined } from '../../utils/omitUndefined';
import useDebounce from '../../components/Utilities/useDebounce';
import type {
  useAccountState,
  useAccountDispatch,
} from '../../authentication/hooks';
import type { useModalState } from '../../components/modals/ModalContext';
import { DashboardTab } from '../../components/SearchFilter/types';
import type { UserProfile } from '../../components/SearchFilter/types';
import { defaultFilter } from '../common/constants';
import { mapToUserProfile, toDashboardTab } from '../common/helperFunctions';
import { BranchSelectionModalMode } from '../../components/modals/BranchSelectorModal/enums';

type AccountDetails = NonNullable<
  ReturnType<typeof useAccountState>
>['details'];

interface UseDashboardFiltersArgs {
  accountDetails: AccountDetails | undefined;
  accountDispatch: ReturnType<typeof useAccountDispatch>;
  branchSelectionModalMode: NonNullable<
    ReturnType<typeof useModalState>
  >['branchSelectionModalMode'];
}

export const useDashboardFilters = ({
  accountDetails,
  accountDispatch,
  branchSelectionModalMode,
}: UseDashboardFiltersArgs) => {
  // Seed the debounce with the saved search so mounting does not fetch once without it
  // and then fetch again when the initial profile reaches the debounce timer.
  const [initialFilters, setInitialFilters] = useState<UserProfile | undefined>(
    () =>
      accountDetails?.userProfile
        ? mapToUserProfile(accountDetails.userProfile)
        : undefined,
  );
  const savedUserProfile = accountDetails?.userProfile;

  // Paging
  const [currentPage, setCurrentPage] = useState(
    initialFilters?.filterCurrentPage ?? 1,
  );
  const [activeTab, setActiveTab] = useState(
    initialFilters?.filterActiveTab ?? DashboardTab.Drafts,
  );

  const saveUserProfile = (userProfile: UserProfile) => {
    void accountDispatch?.setUserProfile({
      testingCalibrationDashboard: omitUndefined(userProfile),
    });
  };

  const changeTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (initialFilters) {
      const profile = {
        ...initialFilters,
        filterActiveTab: tab,
        filterCurrentPage: 1,
      };
      setInitialFilters(profile);
      saveUserProfile(profile);
    }
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
    if (initialFilters) {
      const profile = {
        ...initialFilters,
        filterCurrentPage: page,
      };
      setInitialFilters(profile);
      saveUserProfile(profile);
    }
  };

  // Set values from the userprofile whenever a new one arrives. Done during
  // render (guarded by the last profile applied) instead of from an effect.
  const [appliedUserProfile, setAppliedUserProfile] =
    useState<typeof savedUserProfile>(undefined);
  if (savedUserProfile && savedUserProfile !== appliedUserProfile) {
    setAppliedUserProfile(savedUserProfile);
    const p = mapToUserProfile(savedUserProfile);
    setActiveTab(p.filterActiveTab ?? DashboardTab.Drafts);
    setCurrentPage(p.filterCurrentPage ?? defaultFilter.filterCurrentPage);
    setInitialFilters((prevState) => prevState ?? p);
  }

  // Set to default userprofile page number when the branch is changed.
  // The reset fires once per branch selection. Keying on the selection itself
  // rather than on the profile's current page matters twice over: writing the
  // profile replaces `savedUserProfile`, which this effect depends on, so a
  // value-free guard would loop; and comparing the saved page against the
  // default skipped the whole reset - tab and filters included - whenever the
  // user already sat on page 1, which is the common case.
  const branchResetKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const branchResetKey = `${branchSelectionModalMode ?? ''}:${accountDetails?.defaultOrganisationId ?? ''}`;

    if (
      savedUserProfile &&
      branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg &&
      branchResetKeyRef.current !== branchResetKey
    ) {
      branchResetKeyRef.current = branchResetKey;
      const tcDash = savedUserProfile.testingCalibrationDashboard;
      const profile = {
        filterYearType: tcDash?.filterYearType,
        filterStatusType: tcDash?.filterStatusType,
        filtersChanged: tcDash?.filtersChanged,
        filterSortOrder: tcDash?.filterSortOrder,
        filterCurrentPage: defaultFilter.filterCurrentPage,
        filterActiveTab: toDashboardTab(tcDash?.filterActiveTab),
        filterSearchText: tcDash?.filterSearchText,
      };
      setActiveTab(profile.filterActiveTab ?? DashboardTab.Drafts);
      // profile.filterCurrentPage is assigned defaultFilter.filterCurrentPage a few lines
      // above, so it can never be nullish and the fallback here was unreachable.
      setCurrentPage(profile.filterCurrentPage);
      void accountDispatch?.setUserProfile({
        testingCalibrationDashboard: omitUndefined(profile),
      });
      setInitialFilters(profile);
    }
  }, [
    accountDispatch,
    accountDetails?.defaultOrganisationId,
    branchSelectionModalMode,
    savedUserProfile,
  ]);

  const debouncedSearchText = useDebounce(
    initialFilters?.filterSearchText,
    300,
  );
  const stableFilters = useMemo(
    () => ({
      filterActiveTab: initialFilters?.filterActiveTab,
      filterCurrentPage: initialFilters?.filterCurrentPage,
      filterYearType: initialFilters?.filterYearType,
      filterStatusType: initialFilters?.filterStatusType,
      filterSortOrder: initialFilters?.filterSortOrder,
      filterSearchText: debouncedSearchText,
    }),
    [
      initialFilters?.filterActiveTab,
      initialFilters?.filterCurrentPage,
      initialFilters?.filterYearType,
      initialFilters?.filterStatusType,
      initialFilters?.filterSortOrder,
      debouncedSearchText,
    ],
  );

  return {
    initialFilters,
    setInitialFilters,
    currentPage,
    setCurrentPage,
    activeTab,
    changeTab,
    changePage,
    stableFilters,
  };
};
