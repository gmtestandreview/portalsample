import { createContext } from 'react';
import type { UserProfileDto } from '../api/web-api-client';

export interface AccountDetails {
    organisation: string;
    trading: string;
    branch: string;
    homeAccountId: string;
    givenName?: string;
    familyName?: string;
    email?: string;
    abn?: string;
    targetOrganisation?: TargetOrganisation;
    userAcceptedTermsOfUse: boolean;
    accountCreationCompleted: boolean;
    accountContactCompleted: boolean;
    currentTermsVersion: string;
    defaultOrganisationId?: number;
    organisationCRMGuid?: string;
    organisationIsCompleted: boolean;
    isDefaultOrganisation: boolean;
    showBranchSelector: boolean;
    branchSelectionModalMode?: string;
    callingPath?: string;
    rfqId?: string;
    contactId?: number;
    userProfile?: UserProfileDto;
}

export interface TargetOrganisation {
    targetOrganisationAbn: string;
    targetOrganisationName: string;
}

export interface AccountStateContext {
    isLoading?: boolean;
    details: AccountDetails | null;
}

export interface AccountDispatchContext {
    setAgree: () => void;
    setCompleted: () => void;
    setContactCompleted: () => void;
    setDefaultOrganisationId: (defaultOrganisationId: number | undefined, defaultOrganisationCRMId: string | undefined) => void;
    setTargetOrganisation: (targetOrganisationAbn: string, targetOrganisationName: string) => void;
    setOrganisationAndBranch: (organisationName: string, tradingName: string, branchName: string) => void;
    setShowBranchSelector: (show: boolean) => void;
    setShowRFQSelectModal: (show: boolean, rfqId: string, callingPath: string) => void;
    setUserProfile: (userProfile: UserProfileDto) => Promise<boolean>;
}

// Combined type kept for Props helper functions that need both state and dispatch.
export type AccountContextState = AccountStateContext & AccountDispatchContext;

export const AccountStateCtx = createContext<AccountStateContext | null>(null);
export const AccountDispatchCtx = createContext<AccountDispatchContext | null>(null);
