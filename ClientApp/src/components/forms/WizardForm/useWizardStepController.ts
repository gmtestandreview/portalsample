import { orIfEmpty } from '../../../utils/orIfEmpty';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { SeverityLevel } from '@microsoft/applicationinsights-common';
import { ErrorType } from './types';
import type { WizardStepError } from './types';
import type { FormValues } from '../types';
import type {
  WizardStepControllerOptions,
  WizardStepElement,
} from './wizardStepContracts';
import { resolveErrorState } from './errorState';
import { FormStepStatus } from '../../../api/web-api-client';
import type { ProblemDetails } from '../../../api/web-api-client';
import { nullOrUndefinedToEmpty } from '../../../utils';
import {
  setDashboardNotification,
  setGetStartedNotification,
} from '../../../storage/notification';
import { NotificationSeverity } from '../../../storage/types';
import {
  useAccountState,
  useAccountDispatch,
} from '../../../authentication/hooks';
import { env } from '../../../env';
import AppLogger from '../../../instrumentation/AppLogger';
import { areFormValuesEqual } from '../../../utils/areFormValuesEqual';

const getSubmitBaseUrl = (result: unknown): string | undefined => {
  if (typeof result !== 'object' || result === null || !('baseUrl' in result)) {
    return undefined;
  }

  const baseUrl = result.baseUrl;
  return typeof baseUrl === 'string' ? baseUrl : undefined;
};

/** What the step component should do with the current controller state. */
export type WizardStepView =
  | { kind: 'form' }
  | { kind: 'navigate'; to: string }
  | { kind: 'blank' };

export interface WizardStepController<T extends FormValues> {
  isLoading: boolean;
  /** Values loaded from the server for this step; the form's initial values. */
  stepValues: T;
  errorState: WizardStepError;
  view: WizardStepView;
  submitStep: (values: T) => Promise<void>;
  saveAndExitStep: (values: T) => Promise<void>;
  cancel: () => void;
}

/** Loads and saves a wizard step and resolves navigation for either form shell. */
export const useWizardStepController = <T extends FormValues>(
  props: Readonly<WizardStepControllerOptions<T>>,
  initialValues: T,
): WizardStepController<T> => {
  const {
    stepStatuses,
    loadStepValues,
    locationAfterExit,
    locationOnCompletion,
    currentStepIndex,
    allSteps,
    url,
    onSaveAndExit,
    onSaveAndNext,
    getRedirectionLocationOnError,
    discard,
  } = props;

  const navigate = useNavigate();
  const accountState = useAccountState();
  const accountDispatch = useAccountDispatch();
  const controllerRef = useRef<AbortController | null>(null);
  const loadStepValuesRef = useRef(loadStepValues);
  const getRedirectionLocationOnErrorRef = useRef(
    getRedirectionLocationOnError,
  );

  useEffect(() => {
    loadStepValuesRef.current = loadStepValues;
  }, [loadStepValues]);

  useEffect(() => {
    getRedirectionLocationOnErrorRef.current = getRedirectionLocationOnError;
  }, [getRedirectionLocationOnError]);

  const abortSignal = () => {
    const controller = new AbortController();
    controllerRef.current = controller;
  };

  const [stepValues, setStepValues] = useState<T>({
    ...initialValues,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<WizardStepError>({
    kind: 'none',
  });

  // A new step starts without the previous step's error. Reset it during
  // render (guarded by the step it was last reset for) instead of from the
  // load effect.
  const [errorStepIndex, setErrorStepIndex] = useState(currentStepIndex);
  if (errorStepIndex !== currentStepIndex) {
    setErrorStepIndex(currentStepIndex);
    setErrorState({ kind: 'none' });
  }

  const loadData = useCallback(async () => {
    try {
      abortSignal();
      const currentStep = await loadStepValuesRef.current(
        controllerRef.current?.signal,
      );
      setStepValues(nullOrUndefinedToEmpty(currentStep.stepValues));
    } catch (error) {
      const err = error as Error;
      AppLogger.error('Could not load data for form step.', err);
      const loadServerError = error as ProblemDetails;
      AppLogger.trace(
        'Could not load data for form step.',
        SeverityLevel.Error,
        {
          problemDetails: loadServerError,
          err,
        },
      );
      setErrorState(
        resolveErrorState(
          error,
          getRedirectionLocationOnErrorRef.current,
          ErrorType.Load,
        ),
      );
      AppLogger.error('Failed to Load step values', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [currentStepIndex, loadData]);

  useEffect(() => {
    if (errorState.kind === 'concurrency') {
      // Reload the saved values but keep the conflict banner, so the user is
      // told why their edits were replaced.
      void loadData();
    }
  }, [errorState.kind, loadData]);

  useEffect(() => {
    if (errorState.kind === 'noThirdPartyAccess') {
      setDashboardNotification({
        message:
          'You no longer have access to the records for' +
          ` ${accountState?.details?.targetOrganisation?.targetOrganisationName ?? ''}. Your changes have not been saved.`,
        severity: NotificationSeverity.Error,
      });
      if (accountDispatch) {
        accountDispatch.setTargetOrganisation(
          accountState?.details?.abn ?? '',
          accountState?.details?.organisation ?? '',
        );
      }
    }
  }, [
    accountDispatch,
    accountState?.details?.abn,
    accountState?.details?.organisation,
    accountState?.details?.targetOrganisation?.targetOrganisationName,
    errorState.kind,
  ]);

  useEffect(() => {
    if (errorState.kind === 'gone') {
      setGetStartedNotification({
        message: 'You currently do not have access. Please sign in again.',
        severity: NotificationSeverity.Error,
      });
      globalThis.location.replace('/sign-out');
    }
  }, [errorState.kind]);

  const nextStep =
    currentStepIndex < allSteps.length - 1
      ? allSteps.at(currentStepIndex + 1)
      : false;

  const goToStep = (step: WizardStepElement, baseUrl?: string) =>
    baseUrl && url !== baseUrl
      ? navigate(`${baseUrl}${step.props.location}`, { replace: true })
      : navigate(`${url}${step.props.location}`);

  const submitStep = async (values: T) => {
    if (onSaveAndNext) {
      abortSignal();
      setErrorState({ kind: 'none' });
      try {
        const isDirty = !areFormValuesEqual(stepValues, values);
        const result = await onSaveAndNext(
          values,
          isDirty,
          controllerRef.current?.signal,
        );
        // Immutable update: replace the DTO at currentStepIndex with a new
        // object, rather than mutating the existing one in place.
        const currentStatus = stepStatuses.at(currentStepIndex);
        if (currentStatus !== undefined) {
          stepStatuses.splice(currentStepIndex, 1, {
            ...currentStatus,
            status: FormStepStatus.Completed,
          });
        }
        if (nextStep) {
          void goToStep(nextStep, getSubmitBaseUrl(result));
        } else {
          void navigate(locationOnCompletion);
        }
      } catch (error) {
        AppLogger.error('Could not submit form step.', error as Error, {
          stepIndex: currentStepIndex,
        });
        const saveServerError = error as ProblemDetails;
        AppLogger.trace('Could not submit form step.', SeverityLevel.Error, {
          stepIndex: currentStepIndex,
          problemDetails: {
            status: saveServerError.status,
            title: saveServerError.title,
          },
        });
        setErrorState(
          resolveErrorState(
            error,
            getRedirectionLocationOnErrorRef.current,
            ErrorType.Update,
          ),
        );
      }
    }
  };

  const saveAndExitStep = async (values: T) => {
    if (onSaveAndExit) {
      abortSignal();
      setErrorState({ kind: 'none' });
      try {
        const isDirty = !areFormValuesEqual(stepValues, values);
        await onSaveAndExit(values, isDirty, controllerRef.current?.signal);
        void navigate(orIfEmpty(locationAfterExit, '/'));
      } catch (error) {
        const err = error as Error;
        AppLogger.error('Could not save form step.', err, {
          stepIndex: currentStepIndex,
        });
        const saveServerError = error as ProblemDetails;
        AppLogger.trace('Could not save form step.', SeverityLevel.Error, {
          stepIndex: currentStepIndex,
          problemDetails: {
            status: saveServerError.status,
            title: saveServerError.title,
          },
        });
        setErrorState(
          resolveErrorState(
            error,
            getRedirectionLocationOnErrorRef.current,
            ErrorType.Update,
          ),
        );
      }
    } else {
      void navigate(orIfEmpty(locationAfterExit, '/'));
    }
  };

  const cancel = () => {
    if (discard?.onDiscard) {
      discard.onDiscard();
    }
    // New option for Wizard footer Cancel button
    if (discard?.onCancel) {
      discard.onCancel();
    }
    const discardLocation = discard?.locationOnDiscard;
    if (discardLocation?.startsWith('https://')) {
      globalThis.location.replace(env.VITE_EXTERNAL_REDIRECT_URL);
      return;
    }
    void navigate(
      orIfEmpty(discard?.locationOnCancel, orIfEmpty(discardLocation, '/')),
    );
  };

  return {
    isLoading,
    stepValues,
    errorState,
    view: resolveView({
      errorState,
      isLoading,
      currentStepIndex,
      stepStatuses,
      allSteps,
      url,
    }),
    submitStep,
    saveAndExitStep,
    cancel,
  };
};

interface ViewInput {
  errorState: WizardStepError;
  isLoading: boolean;
  currentStepIndex: number;
  stepStatuses: WizardStepControllerOptions<FormValues>['stepStatuses'];
  allSteps: readonly WizardStepElement[];
  url: string;
}

/** Same precedence the component used: error outcomes first, then the guard. */
const resolveView = ({
  errorState,
  isLoading,
  currentStepIndex,
  stepStatuses,
  allSteps,
  url,
}: ViewInput): WizardStepView => {
  if (errorState.kind === 'redirect') {
    return { kind: 'navigate', to: errorState.location };
  }
  if (errorState.kind === 'notFound') {
    return { kind: 'navigate', to: '/not-found' };
  }
  if (errorState.kind === 'loading') {
    return { kind: 'navigate', to: '/server-error' };
  }
  if (errorState.kind === 'noThirdPartyAccess') {
    return { kind: 'navigate', to: '/dashboard' };
  }
  if (errorState.kind === 'gone') {
    return { kind: 'blank' };
  }

  if (!isLoading && currentStepIndex > 0) {
    const firstIncompleteStepIndex = stepStatuses.findIndex(
      (x) => x.status !== FormStepStatus.Completed,
    );
    if (
      firstIncompleteStepIndex !== -1 &&
      firstIncompleteStepIndex < currentStepIndex
    ) {
      return {
        kind: 'navigate',
        to: [url, allSteps.at(firstIncompleteStepIndex)?.props.location].join(
          '',
        ),
      };
    }
  }
  return { kind: 'form' };
};
