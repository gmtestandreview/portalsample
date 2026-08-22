import type { FormikHelpers, FormikProps, FormikValues } from 'formik';
import type { ReactNode } from 'react';
import type { AnyObjectSchema } from 'yup';
import type { Hideable } from '../types';

export interface DiscardProps {
    locationOnDiscard?: string;
    discardButtonTitle?: string;
    cancelButtonTitle?: string;
    showCancelButton?: boolean;
    locationOnCancel?: string;
    onDiscard?: () => void;
    onCancel?: () => void;
    [key: string]: unknown;
}

export interface ModalProps {
    titleText?: string;
    bodyText?: JSX.Element | string;
    modalTitle?: string;
    modalBodyText?: JSX.Element | string;
    yesButtonTitle?: string;
    noButtonTitle?: string;
    [key: string]: unknown;
}

export type ValidationSchema = Pick<AnyObjectSchema, 'validate'>;

export type Validation<T extends FormikValues = FormikValues> =
    | ValidationSchema
    | ((values: T) => Record<string, unknown> | Promise<Record<string, unknown>>);

export interface FormikFormProps<T extends FormikValues> {
    initialValues: T;
    isLoading?: boolean;
    validateSoft?: Validation<T>;
    validateHard?: Validation<T>;
    onSubmit: (values: T, formikHelpers: FormikHelpers<T>) => void | Promise<unknown>;
    promptPath?: string;
    children?: ReactNode | ((bag: FormikProps<T>) => ReactNode);
    banner?: ReactNode;
    discard?: DiscardProps;
    hidingFields?: Hideable<Partial<T>, Partial<T>>;
    onSaveAndExit?: (values: T, formikHelpers: FormikHelpers<T>) => void | Promise<unknown>;
    bannerTitle?: string;
    bannerRefTitle?: string;
    bannerSubTitle?: string;
    canSaveDraft?: boolean;
    showGoToDashboardButton?: boolean;
    showBanner?: boolean;
    isSummaryPage?: boolean;
    [key: string]: unknown;
}
