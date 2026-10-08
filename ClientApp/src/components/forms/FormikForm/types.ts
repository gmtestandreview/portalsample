import type { FormikHelpers, FormikProps, FormikValues } from 'formik';
import type { ReactNode } from 'react';
import type { DiscardProps, Hideable, Validation } from '../types';

export interface FormikFormProps<T extends FormikValues> {
  initialValues: T;
  isLoading?: boolean;
  validateSoft?: Validation<T>;
  validateHard?: Validation<T>;
  onSubmit: (
    values: T,
    formikHelpers: FormikHelpers<T>
  ) => void | Promise<unknown>;
  promptPath?: string;
  children?: ReactNode | ((bag: FormikProps<T>) => ReactNode);
  banner?: ReactNode;
  discard?: DiscardProps;
  hidingFields?: Hideable<Partial<T>, Partial<T>> | undefined;
  onSaveAndExit?: (
    values: T,
    formikHelpers: FormikHelpers<T>
  ) => void | Promise<unknown>;
  bannerTitle?: string;
  bannerRefTitle?: string;
  bannerSubTitle?: string;
  canSaveDraft?: boolean;
  showGoToDashboardButton?: boolean;
  showBanner?: boolean;
  isSummaryPage?: boolean;
  [key: string]: unknown;
}
