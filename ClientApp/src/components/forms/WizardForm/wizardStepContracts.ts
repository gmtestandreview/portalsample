import type { ReactElement } from 'react';
import type { FormStepStatusDto } from '../../../api/web-api-client';
import type { DiscardProps, FormValues } from '../types';
import type { ErrorType } from './types';

export type WizardStepElement = ReactElement<{
  title: string;
  location: string;
}>;

export type WizardStepLoader<T extends FormValues> = (
  signal?: AbortSignal,
) => { stepValues: T } | Promise<{ stepValues: T }>;

export type WizardStepSaver<T extends FormValues> = (
  values: T,
  isDirty: boolean,
  signal?: AbortSignal,
) => undefined | Promise<unknown>;

export interface WizardStepControllerOptions<T extends FormValues> {
  stepStatuses: FormStepStatusDto[];
  loadStepValues: WizardStepLoader<T>;
  onSaveAndNext?: WizardStepSaver<T>;
  onSaveAndExit?: WizardStepSaver<T>;
  getRedirectionLocationOnError?: (
    errorCode: number,
    errorType: ErrorType,
  ) => string | undefined;
  discard?: DiscardProps;
  url: string;
  currentStepIndex: number;
  allSteps: readonly WizardStepElement[];
  locationAfterExit?: string;
  locationOnCompletion: string;
}
