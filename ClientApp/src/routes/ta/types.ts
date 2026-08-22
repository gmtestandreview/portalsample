import type { FormikFormProps, FormikValues } from 'formik';
import type { ReactNode } from 'react';
import type {
    FormStepStatus} from '../../api/web-api-client';
import {
    type AttachmentDto, type FileParameter, type UploadProgress, type PatternApprovalDashboardDto,
    type ApplicationAndInstrumentStep,
    type LookupResponse,
    type InstrumentTypeContentDto,
    type PatternApprovalOrgAndContact,
    type SupportingDocumentsStep
} from '../../api/web-api-client';
import { DashboardTab } from '../../components/SearchFilter/types';
import type { Hideable } from '../../components/forms/types';
import type { InitialValue } from '../../types';

export interface TASummaryProps {
    isSubmitted?: boolean;
    name: string;
    id?: string;
}

export interface TAOrganisationAndContactProps {
    isSummary?: boolean;
    name: string;
}

export interface TAApplicationAndInstrumentProps {
    isSummary?: boolean;
    name: string;
}

export interface TASupportingDocumentsProps {
    isSummary: boolean;
    name: string;
    attachment: AttachmentFunction;
    onUploadAttachment: (token: string, fileData: FileParameter[]) => Promise<AttachmentDto[]>;
    progress?: UploadProgress;
    setProgress?: React.Dispatch<React.SetStateAction<UploadProgress | undefined>>;
    uploading?: boolean;
    handleCancelFile?: (fileName: string) => Promise<void>;
    disableUpload?: boolean;
    suppressDocChanges?: boolean;
    externalErrors?: string[];
    setExternalErrors?: React.Dispatch<React.SetStateAction<string[]>>;
}
export interface AttachmentFunction {
    onUploadFiles: (files: File[]) => Promise<AttachmentDto[]>;
}

export enum FileStatus {
    Completed = 'Completed',
    Failed = 'Failed',
    Uploading = 'Uploading',
    Cancelled = 'Cancelled',
    Pending = 'Pending',
}

export enum ValidationMessages {
    RequiredDoc = 'Upload at least one supporting document before proceeding.',
    RequiredTag = 'Select a category that best describes this document.',
}

export class PatternApprovalDashboard implements PatternApprovalDashboardDto {
    filterStatusType?: string;

    filterYearType?: string;

    filterSortOrder?: string;

    filtersChanged?: boolean;

    filterCurrentPage?: number;

    filterActiveTab?: DashboardTab;

    filterSearchText?: string;

    constructor(init?: Partial<PatternApprovalDashboard>) {
        this.filterStatusType = init?.filterStatusType ?? 'allStatuses';
        this.filterYearType = init?.filterYearType ?? 'allYears';
        this.filterSortOrder = init?.filterSortOrder ?? 'descending';
        this.filtersChanged = init?.filtersChanged ?? false;
        this.filterCurrentPage = init?.filterCurrentPage ?? 1;
        this.filterActiveTab = init?.filterActiveTab ?? DashboardTab.Drafts;
        this.filterSearchText = init?.filterSearchText ?? '';
    }
}

export interface ApplicationAndInstrumentStepDto extends ApplicationAndInstrumentStep {
    certNameOptions?: LookupResponse[];
    instrumentCategoryLookup?: LookupResponse[];
    instrumentTypeLookup?: LookupResponse[];
    instrumentTypeContent?: InstrumentTypeContentDto[];
}

export interface RequestForPatternApprovalSummaryDto {
    referenceId?: string | undefined;
    previousPortalRefIdGUID?: string | undefined;
    previousPortalRefId?: string | undefined;
    acceptNMIP106?: boolean | undefined;
    acceptTermsAndConditions?: boolean | undefined;
    acceptDeclaration?: boolean | undefined;
    organisationAndContact?: PatternApprovalOrgAndContact | undefined;
    applicationAndInstrument?: ApplicationAndInstrumentStepDto | undefined;
    supportingDocuments?: SupportingDocumentsStep | undefined;
    formStepStatus?: FormStepStatus;
}

export type SinglePageFormProps<T extends FormikValues> =
    Omit<FormikFormProps,
    'isLoading' |
    'promptPath' |
    'onSubmit' |
    'children' |
    'initialValues' |
    'canSaveDraft' |
    'showBanner' |
    'onSaveAndExit'>
    & {
        title: string;
        children?: ReactNode;
        location: string;
        initialValues: InitialValue<T>;
        loadStepValues: (abortSignal?: AbortSignal) => SinglePageFormValues<T> | Promise<SinglePageFormValues<T>>;
        hidingFields: Hideable<Partial<T>, Partial<T>> | undefined;
        isSummaryPage?: boolean;
    };
export interface SinglePageFormValues<T extends FormikValues> {
    formValues: InitialValue<T>;
}
