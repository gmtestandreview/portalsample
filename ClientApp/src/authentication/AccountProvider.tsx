import { BrowserUtils, InteractionStatus } from '@azure/msal-browser';
import type { AccountInfo } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { UsersClient } from '../api/web-api-client';
import type { UserDto, UserProfileDto } from '../api/web-api-client';
import BlockUISpinner from '../components/BlockUISpinner';
import setTargetOrganisation, { getTargetOrganisation } from '../storage/targetOrganisation';
import { AccountStateCtx, AccountDispatchCtx } from './accountContext';
import type { AccountDetails } from './accountContext';
import { tokenRequest } from './authConfig';
import termsData from '../terms-config.json';
import AppLogger from '../instrumentation/AppLogger';


interface AccountProviderProps {
    children: ReactNode;
}

const toAccountDetails = (
    account: AccountInfo,
    user: UserDto,
) : AccountDetails => {
    const currentTermsVersion = termsData.TermsVersion;
    const acceptedTermsAndCondition = !!(user?.acceptedTerms === true
        && user.termsVersion?.toString() === currentTermsVersion);
    const accountCreationCompleted = !!((user.organisation && user.organisation?.accountCompleted === true));
    const accountContactCompleted = !!((user.contact && user.contact?.isCompleted === true));
    const tokenClaims = account.idTokenClaims as any;
    const businessContext = getTargetOrganisation();

    return {
        homeAccountId: account.homeAccountId,
        organisation: user.organisation?.name || '',
        trading: user.organisation?.businessOrTradingName || '',
        branch: user.organisation?.branchOrLocationName || '',
        abn: user.organisation?.abn || user.employerAbn || '',
        email: tokenClaims?.email,
        familyName: tokenClaims?.family_name,
        givenName: tokenClaims?.given_name,
        userAcceptedTermsOfUse: acceptedTermsAndCondition,
        accountCreationCompleted,
        accountContactCompleted,
        targetOrganisation: {
            targetOrganisationAbn: businessContext?.targetOrganisationAbn ?? '',
            targetOrganisationName: businessContext?.targetOrganisationName ?? '',
        },
        currentTermsVersion,
        defaultOrganisationId: user.defaultOrganisationId,
        organisationCRMGuid: user.organisation?.crmGuid,
        organisationIsCompleted: user.organisation?.isCompleted || false,
        isDefaultOrganisation: user.defaultOrganisationId !== null,
        showBranchSelector: false,
        contactId: user.contactId,
        userProfile: user.userProfile ?? undefined,
    };
};

const AccountProvider = ({ children } : AccountProviderProps) => {
    const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
    const [userProfileDetails, setUserProfileDetails] = useState<UserProfileDto>();
    const [errored, setErrored] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { inProgress, accounts, instance } = useMsal();

    const setAgree = useCallback(() => {
        setAccountDetails((prev) => {
            if (!prev) return prev;
            return { ...prev, userAcceptedTermsOfUse: true };
        });
    }, []);

    const setUserProfile = useCallback(async (profile: UserProfileDto): Promise<boolean> => {
        if (profile !== undefined) {
            setUserProfileDetails((prev) => ({ ...prev, ...profile }));
            setAccountDetails((prev) => {
                if (!prev) return prev;
                return { ...prev, userProfile: { ...prev.userProfile, ...profile } };
            });
        }
        return true;
    }, []);

    const setShowBranchSelector = useCallback((show: boolean) => {
        setAccountDetails((prev) => {
            if (!prev) return prev;
            return { ...prev, showBranchSelector: show };
        });
    }, []);

    const setShowRFQSelectModal = useCallback((show: boolean, rfqId: string, callingPath: string) => {
        setAccountDetails((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                showBranchSelector: show,
                rfqId,
                callingPath,
            };
        });
    }, []);

    const setOrganisation = useCallback(async (abn: string, name: string) => {
        setTargetOrganisation({
            targetOrganisationAbn: abn,
            targetOrganisationName: name,
        });
        setAccountDetails((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                targetOrganisation: {
                    targetOrganisationAbn: abn,
                    targetOrganisationName: name,
                },
            };
        });
    }, []);

    const setCompleted = useCallback(() => {
        setAccountDetails((prev) => {
            if (!prev) return prev;
            return { ...prev, accountCreationCompleted: true };
        });
    }, []);

    const setContactCompleted = useCallback(() => {
        setAccountDetails((prev) => {
            if (!prev) return prev;
            return { ...prev, accountContactCompleted: true };
        });
    }, []);

    const setDefaultOrganisationId = useCallback((defaultOrganisationId: number | undefined, defaultOrganisationCRMId: string | undefined) => {
        setAccountDetails((prev) => {
            if (!prev) return prev;
            return { ...prev, defaultOrganisationId, organisationCRMGuid: defaultOrganisationCRMId };
        });
    }, []);

    const setOrganisationAndBranch = useCallback(async (organisationName: string, tradingName: string, branchName: string) => {
        setAccountDetails((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                organisation: organisationName,
                trading: tradingName ?? '',
                branch: branchName ?? '',
            };
        });
    }, []);

    useEffect(() => {
        const saveUserProfile = async () => {
            if (accounts.length > 0 && userProfileDetails) {
                try {
                    const client = new UsersClient();
                    const tokenResult = await instance.acquireTokenSilent({
                        ...tokenRequest,
                        account: accounts[0],
                    });
                    client.setAuthToken(tokenResult.accessToken);
                    await client.setUserProfile(
                        userProfileDetails?.firstName,
                        userProfileDetails?.lastName,
                        userProfileDetails?.email,
                        userProfileDetails?.services,
                        userProfileDetails?.testingCalibrationDashboard?.filterStatusType,
                        userProfileDetails?.testingCalibrationDashboard?.filterYearType,
                        userProfileDetails?.testingCalibrationDashboard?.filterSortOrder,
                        userProfileDetails?.testingCalibrationDashboard?.filtersChanged,
                        userProfileDetails?.testingCalibrationDashboard?.filterCurrentPage,
                        userProfileDetails?.testingCalibrationDashboard?.filterActiveTab,
                        userProfileDetails?.testingCalibrationDashboard?.filterSearchText,
                        userProfileDetails?.patternApprovalDashboard?.filterStatusType,
                        userProfileDetails?.patternApprovalDashboard?.filterYearType,
                        userProfileDetails?.patternApprovalDashboard?.filterSortOrder,
                        userProfileDetails?.patternApprovalDashboard?.filtersChanged,
                        userProfileDetails?.patternApprovalDashboard?.filterCurrentPage,
                        userProfileDetails?.patternApprovalDashboard?.filterActiveTab,
                        userProfileDetails?.patternApprovalDashboard?.filterSearchText,
                    );
                } catch (error) {
                    AppLogger.error('Failed to save userprofile', error as Error);
                }
            }
        };
        saveUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accounts, instance, userProfileDetails]);

    useEffect(() => {
        const loadAccountDetails = async () => {
            setIsLoading(true);
            const account = accounts[0];
            try {
                const client = new UsersClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);
                AppLogger.verbose('AccountProvider.loadAccountDetails', { homeAccountId: account.homeAccountId });
                const user = await client.signIn({});
                const businessContext = getTargetOrganisation();
                AppLogger.verbose('AccountProvider.BusinessContext', { homeAccountId: account.homeAccountId, businessContext });
                if (user && !businessContext) {
                    const targetOrg = {
                        targetOrganisationAbn: user?.organisation?.abn ?? '',
                        targetOrganisationName: user?.organisation?.name ?? '',
                    };
                    setTargetOrganisation(targetOrg);
                    AppLogger.verbose('AccountProvider.TargetOrg', { homeAccountId: account.homeAccountId, targetOrg });
                }
                setAccountDetails(toAccountDetails(account, user));
            } catch (error) {
                setErrored(true);
                setAccountDetails(null);
                await instance.handleRedirectPromise();
                await instance.logoutRedirect({
                    account: instance.getActiveAccount(),
                    onRedirectNavigate: () => !BrowserUtils.isInIframe(),
                });
                AppLogger.error('Failed to load loadAccountDetails', error as Error);
            } finally {
                setIsLoading(false);
            }
        };
        if (inProgress === InteractionStatus.Logout) {
            setAccountDetails(null);
        } else if (
            inProgress === InteractionStatus.None
            && accounts.length > 0
            && accounts[0]?.homeAccountId
            && accountDetails?.homeAccountId !== accounts[0]?.homeAccountId) {
            loadAccountDetails();
        }
    }, [inProgress, accounts, accountDetails, accountDetails?.userProfile, instance]);

    const stateValue = useMemo(() => ({
        isLoading,
        details: accountDetails,
    }), [isLoading, accountDetails]);

    const dispatchValue = useMemo(() => ({
        setAgree,
        setCompleted,
        setContactCompleted,
        setDefaultOrganisationId,
        setTargetOrganisation: setOrganisation,
        setOrganisationAndBranch,
        setShowBranchSelector,
        setShowRFQSelectModal,
        setUserProfile,
    }), [
        setAgree,
        setCompleted,
        setContactCompleted,
        setDefaultOrganisationId,
        setOrganisation,
        setOrganisationAndBranch,
        setShowBranchSelector,
        setShowRFQSelectModal,
        setUserProfile,
    ]);

    return (
        <AccountStateCtx.Provider value={stateValue}>
            <AccountDispatchCtx.Provider value={dispatchValue}>
                {isLoading && !errored && (
                    <BlockUISpinner>
                        <p>Loading...</p>
                    </BlockUISpinner>
                )}
                {errored && (
                    <BlockUISpinner>
                        <p>Unable to load account details. Redirecting to sign-in&hellip;</p>
                    </BlockUISpinner>
                )}
                {!errored && children}
            </AccountDispatchCtx.Provider>
        </AccountStateCtx.Provider>
    );
};

export default AccountProvider;
