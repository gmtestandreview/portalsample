import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { ReactElement } from 'react';
import { SeverityLevel } from '@microsoft/applicationinsights-common';
import { ErrorType } from './types';
import type { WizardStepError, WizardStepProps } from './types';
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

// The controller is form-library neutral: it loads a step, saves it, maps
// failures to a view decision and navigates. The form shell (Formik today, React
// Hook Form later) only renders the fields and calls `submitStep` /
// `saveAndExitStep` with the values it collected.
type StepValues = Record<string, any>;

type StepElement = ReactElement<WizardStepProps<StepValues>>;

type StepProps = Pick<
  WizardStepProps<StepValues>,
  | 'stepStatuses'
  | 'loadStepValues'
  | 'onSaveAndExit'
  | 'onSaveAndNext'
  | 'getRedirectionLocationOnError'
  | 'discard'
> & {
  url: string;
  currentStepIndex: number;
  allSteps: StepElement[];
  locationAfterExit?: string;
  locationOnCompletion: string;
};

/** What the step component should do with the current controller state. */
export type WizardStepView =
  { kind: 'form' } | { kind: 'navigate'; to: string } | { kind: 'blank' };

export interface WizardStepController {
  isLoading: boolean;
  /** Values loaded from the server for this step; the form's initial values. */
  stepValues: StepValues;
  errorState: WizardStepError;
  view: WizardStepView;
  submitStep: (values: StepValues) => Promise<void>;
  saveAndExitStep: (values: StepValues) => Promise<void>;
  cancel: () => void;
}

export const useWizardStepController = (
  props: Readonly<StepProps>,
  initialValues: StepValues
): WizardStepController => {
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
  const controllerRef = useRef<AbortController | null>();
  const abortSignal = () => {
    const controller = new AbortController();
    controllerRef.current = controller;
  };

  const [stepValues, setStepValues] = useState<StepValues>({
    ...initialValues,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<WizardStepError>({
    kind: 'none',
  });

  const loadData = useCallback(
    async (options?: { keepErrorState?: boolean }) => {
      if (!options?.keepErrorState) {
        setErrorState({ kind: 'none' });
      }
      try {
        abortSignal();
        const currentStep = await loadStepValues(controllerRef.current?.signal);
        setStepValues(nullOrUndefinedToEmpty(currentStep.stepValues));
      } catch (error) {
        const err = error as Error;
        AppLogger.error('Could not load data for form step.', err);
        const loadServerError = error as ProblemDetails;
        AppLogger.trace(
          'Could not load data for form step.',
          SeverityLevel.Error,
          { problemDetails: loadServerError, err }
        );
        setErrorState(
          resolveErrorState(
            error,
            getRedirectionLocationOnError,
            ErrorType.Load
          )
        );
        AppLogger.error('Failed to Load step values', err);
      } finally {
        setIsLoading(false);
      }
    },
    [loadStepValues] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (errorState.kind === 'concurrency') {
      // Reload the saved values but keep the conflict banner, so the user is
      // told why their edits were replaced.
      void loadData({ keepErrorState: true });
    }
  }, [errorState.kind, loadData]);

  useEffect(() => {
    if (errorState.kind === 'noThirdPartyAccess') {
      setDashboardNotification({
        message:
          'You no longer have access to the records for' +
          ` ${accountState?.details?.targetOrganisation?.targetOrganisationName}. Your changes have not been saved.`,
        severity: NotificationSeverity.Error,
      });
      if (accountDispatch) {
        accountDispatch.setTargetOrganisation(
          accountState?.details?.abn ?? '',
          accountState?.details?.organisation ?? ''
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorState.kind]);

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

  const goToStep = (step: StepElement, baseUrl?: string) =>
    baseUrl && url !== baseUrl
      ? navigate(`${baseUrl}${step.props.location}`, { replace: true })
      : navigate(`${url}${step.props.location}`);

  const submitStep = async (values: StepValues) => {
    if (onSaveAndNext) {
      abortSignal();
      setErrorState({ kind: 'none' });
      try {
        const isDirty = !areFormValuesEqual(stepValues, values);
        const result = await onSaveAndNext(
          values,
          isDirty,
          controllerRef.current?.signal
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
          void goToStep(nextStep, result?.baseUrl);
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
            status: saveServerError?.status,
            title: saveServerError?.title,
          },
        });
        setErrorState(
          resolveErrorState(
            error,
            getRedirectionLocationOnError,
            ErrorType.Update
          )
        );
      }
    }
  };

  const saveAndExitStep = async (values: StepValues) => {
    if (onSaveAndExit) {
      abortSignal();
      setErrorState({ kind: 'none' });
      try {
        const isDirty = !areFormValuesEqual(stepValues, values);
        await onSaveAndExit(values, isDirty, controllerRef.current?.signal);
        void navigate(locationAfterExit || '/');
      } catch (error) {
        const err = error as Error;
        AppLogger.error('Could not save form step.', err, {
          stepIndex: currentStepIndex,
        });
        const saveServerError = error as ProblemDetails;
        AppLogger.trace('Could not save form step.', SeverityLevel.Error, {
          stepIndex: currentStepIndex,
          problemDetails: {
            status: saveServerError?.status,
            title: saveServerError?.title,
          },
        });
        setErrorState(
          resolveErrorState(
            error,
            getRedirectionLocationOnError,
            ErrorType.Update
          )
        );
      }
    } else {
      void navigate(locationAfterExit || '/');
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
    void navigate(discard?.locationOnCancel || discardLocation || '/');
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
  stepStatuses: StepProps['stepStatuses'];
  allSteps: StepElement[];
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
      (x) => x.status !== FormStepStatus.Completed
    );
    if (
      firstIncompleteStepIndex !== -1 &&
      firstIncompleteStepIndex < currentStepIndex
    ) {
      return {
        kind: 'navigate',
        to: `${url}${allSteps.at(firstIncompleteStepIndex)?.props.location}`,
      };
    }
  }
  return { kind: 'form' };
};
