 
import type { ReactElement, ReactNode } from 'react';
import type { FormikHelpers, FormikValues } from 'formik';
import type { InitialValue } from '../../../types';
import type { DiscardProps, ModalProps } from '../FormikForm/types';
import type { FormStepStatusDto, ProblemDetails, ValidationProblemDetails } from '../../../api/web-api-client';

export interface WizardFormStepValues<T extends FormikValues> {
    stepValues: InitialValue<T>;
}

/**
 * Full prop surface of WizardRoutedStep: the union of WizardStepProps (step-level),
 * WizardFormProps (form-level, shared across steps), and three routing props added
 * by WizardForm when it instantiates each route.
 *
 * Approximately 29 distinct props after deduplication. The [key: string]: any
 * index signatures on WizardStepProps and WizardFormProps are retained for
 * backwards compatibility; a future cleanup pass can narrow these.
 *
 * @property allSteps        - All WizardStep children of the parent WizardForm.
 *                             Used for step navigation, the SteppedNavigation bar,
 *                             and the linear progress guard.
 * @property currentStepIndex - Zero-based index of the currently active step.
 * @property url              - Resolved base URL of the WizardForm route (from
 *                             useResolvedPath in WizardForm). Prepended to each
 *                             step's location when building navigation paths.
 */
export type WizardRoutedStepProps<T extends FormikValues> = WizardStepProps<T> & WizardFormProps & {
    allSteps: React.ReactElement<any>[];
    currentStepIndex: number;
    url: string;
};

export enum ErrorType {
    Load,
    Update,
}

export type WizardStepError =
    | { kind: 'none' }
    | { kind: 'loading' }
    | { kind: 'notFound' }
    | { kind: 'noThirdPartyAccess' }
    | { kind: 'gone' }
    | { kind: 'concurrency'; details: ProblemDetails | ValidationProblemDetails }
    | { kind: 'wafViolation'; details: ProblemDetails | ValidationProblemDetails }
    | { kind: 'serverError'; details: ProblemDetails | ValidationProblemDetails }
    | { kind: 'redirect'; location: string };

/**
 * Props owned by an individual wizard step (WizardStep).
 * WizardRoutedStep receives all of these via WizardForm's render loop.
 *
 * @property title          - <h1> heading displayed in the step's content body.
 * @property children       - Step content rendered inside the form.
 * @property location       - Route path segment for this step (e.g. '/step-1').
 * @property initialValues  - Formik initial values for this step's form fields.
 * @property isSummaryPage  - When true, suppresses the "required" hint text and disables
 *                            linked errors in ErrorSummary.
 * @property getRedirectionLocationOnError - Optional callback: given an HTTP status code
 *                            and error type (Load | Update), returns a custom redirect
 *                            path, or undefined to use the default error handling.
 * @property discard        - Configuration for the Cancel button: visibility, labels,
 *                            callbacks, and the post-discard navigation target.
 * @property onSaveAndExit  - Called when the user saves a draft and exits. Receives
 *                            form values, isDirty flag, Formik helpers, and an optional
 *                            AbortSignal.
 * @property onSaveAndNext  - Called when the user submits the step. Same signature as
 *                            onSaveAndExit. May return { baseUrl } to override the
 *                            base URL used when navigating to the next step.
 * @property stepStatuses   - Mutable array (one entry per step) tracking completion
 *                            state; used by the linear navigation guard to prevent
 *                            skipping ahead.
 * @property loadStepValues - Async function that returns the current server-side
 *                            values for this step. Called on mount and on concurrency
 *                            error retry.
 * @property validateHard   - Yup schema or validation function applied on submit.
 * @property validateSoft   - Yup schema or validation function applied on save-draft.
 * @property hidingFields   - Object describing which fields are hidden; used to strip
 *                            hidden values from the submitted payload.
 * @property bannerTitle    - Primary heading shown in the page banner and used as
 *                            the browser tab title. Distinct from `title`.
 * @property bannerRefTitle - Secondary reference text shown in the banner.
 * @property bannerSubTitle - Supplementary subtitle shown in the banner.
 * @property canSaveDraft   - Whether the save-and-exit (draft) button is shown.
 * @property showSaveAndNextButton - Whether the primary Next/Submit button is shown.
 *                            Defaults to true when undefined.
 * @property showGoToDashboardButton - Whether a Go-to-Dashboard shortcut is shown.
 * @property showBanner     - Whether the page banner is rendered.
 */
export interface WizardStepProps<T extends FormikValues> {
    title: string;
    children?: ReactNode;
    location: string;
    initialValues: InitialValue<T>;
    isSummaryPage?: boolean;
    getRedirectionLocationOnError?: (errorCode: number, errorType: ErrorType) => string | undefined;
    discard?: DiscardProps;
    onSaveAndExit?: (
        values: T,
        isDirty: boolean,
        formikHelpers: FormikHelpers<T>,
        abortSignal?: AbortSignal) => void | Promise<any>;
    onSaveAndNext?: (
        values: T,
        isDirty: boolean,
        formikHelpers: FormikHelpers<T>,
        abortSignal?: AbortSignal) => void | Promise<any>;
    stepStatuses: FormStepStatusDto[];
    loadStepValues: (abortSignal?: AbortSignal) => WizardFormStepValues<T> | Promise<WizardFormStepValues<T>>;
    validateHard?: any;
    validateSoft?: any;
    hidingFields?: any;
    bannerTitle?: string;
    bannerRefTitle?: string;
    bannerSubTitle?: string;
    canSaveDraft?: boolean;
    showSaveAndNextButton?: boolean;
    showGoToDashboardButton?: boolean;
    showBanner?: boolean;
    [key: string]: any;
}

export interface SubmitFormResult {
    baseUrl?: string;
}

/**
 * Props owned by the WizardForm container — shared across all steps.
 * These are passed down to WizardRoutedStep at route construction time.
 *
 * @property children               - One or more WizardStep elements.
 * @property previousButtonTitle    - Label for the Back button. Default: 'Back'.
 * @property nextButtonTitle        - Label for the Save-and-next button.
 * @property lastStepNextButtonTitle - Label for the final-step submit button.
 * @property locationAfterExit      - Route to navigate to after save-and-exit.
 * @property locationOnCompletion   - Route to navigate to after the final step
 *                                    submits successfully.
 * @property canSaveDraft           - Whether the save-and-exit button is shown
 *                                    across all steps.
 * @property showSaveAndNextButton  - Whether the Next/Submit button is shown.
 *                                    Defaults to true when undefined.
 * @property showGoToDashboardButton - Whether the Go-to-Dashboard shortcut shows.
 * @property showBanner             - Whether the page banner renders.
 * @property confirmationOnSubmission - Optional modal config shown before the
 *                                    final step is submitted.
 * @property getRedirectionLocationOnError - See WizardStepProps; propagated to
 *                                    all steps from the form level.
 */
export interface WizardFormProps {
    children?: ReactElement<any> | Array<ReactElement<any>>;
    previousButtonTitle?: string;
    nextButtonTitle?: string;
    lastStepNextButtonTitle?: string;
    locationAfterExit?: string;
    locationOnCompletion: string;
    canSaveDraft?: boolean;
    showSaveAndNextButton?: boolean;
    showGoToDashboardButton?: boolean;
    showBanner?: boolean;
    confirmationOnSubmission?: ModalProps;
    getRedirectionLocationOnError?: (errorCode: number, errorType: ErrorType) => string | undefined;
    [key: string]: any;
}

export interface PreviousStepButtonProps {
    steps: React.ReactElement<any>[];
    currentStepIndex: number;
    title?: string;
    url: string;
    className?: string;
}

export interface NextStepButtonProps {
    steps: any[];
    currentStepIndex: number;
    title?: string;
    finalStepTitle?: string;
    finalStepConfirmation?: ModalProps;
    className?: string;
}
