import { useCallback, useEffect, useRef } from 'react';
import { useAccountDispatch } from '../../authentication/hooks';
import { omitUndefined } from '../../utils/omitUndefined';
import AppLogger from '../../instrumentation/AppLogger';
import { type PatternApprovalDashboardDto } from '../../api/web-api-client';

const TAB_SAVE_DEBOUNCE_MS = 300;

const useDashboardTaProfile = () => {
  const accountDispatch = useAccountDispatch();
  const tabSaveTimeoutRef = useRef<number | null>(null);

  const saveUserProfile = useCallback(
    (userProfile: PatternApprovalDashboardDto) => {
      const profile = {
        filterYearType: userProfile.filterYearType,
        filterStatusType: userProfile.filterStatusType,
        filtersChanged: userProfile.filtersChanged,
        filterSortOrder: userProfile.filterSortOrder,
        filterCurrentPage: userProfile.filterCurrentPage,
        filterActiveTab: userProfile.filterActiveTab,
        filterSearchText: userProfile.filterSearchText,
      };
      accountDispatch
        ?.setUserProfile({ patternApprovalDashboard: omitUndefined(profile) })
        .catch((error: unknown) => {
          AppLogger.error(
            'T & C Dashboard failed to save user profile.',
            error as Error,
          );
        });
    },
    [accountDispatch],
  );

  const saveUserProfileDebounced = (
    userProfile: PatternApprovalDashboardDto,
  ) => {
    if (tabSaveTimeoutRef.current !== null) {
      window.clearTimeout(tabSaveTimeoutRef.current);
    }

    tabSaveTimeoutRef.current = window.setTimeout(() => {
      saveUserProfile(userProfile);
      tabSaveTimeoutRef.current = null;
    }, TAB_SAVE_DEBOUNCE_MS);
  };

  useEffect(
    () => () => {
      if (tabSaveTimeoutRef.current !== null) {
        window.clearTimeout(tabSaveTimeoutRef.current);
      }
    },
    [],
  );

  return { saveUserProfile, saveUserProfileDebounced };
};

export default useDashboardTaProfile;
