import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useResolvedPath } from 'react-router';
import type { FormValues } from '../types';
import RhfWizardRoutedStep from './RhfWizardRoutedStep';
import type { RhfWizardRoutedStepProps } from './RhfWizardRoutedStep';
import WizardStep from './WizardStep';
import type { WizardStepProps } from './types';
import type { WizardStepElement } from './wizardStepContracts';

type SingleStepWizardOptions = Pick<
  RhfWizardRoutedStepProps<FormValues>,
  | 'locationOnCompletion'
  | 'lastStepNextButtonTitle'
  | 'nextButtonTitle'
  | 'previousButtonTitle'
  | 'canSaveDraft'
  | 'confirmationOnSubmission'
>;

interface RhfSingleStepWizardProps<T extends FormValues> {
  wizard: SingleStepWizardOptions;
  step: WizardStepProps<T>;
  children: ReactNode;
}

/**
 * Mounts one wizard step on the React Hook Form shell, resolving the base url and
 * redirecting unknown sub-paths exactly as the legacy `WizardForm` does for a
 * single `WizardStep`.
 */
const RhfSingleStepWizard = <T extends FormValues>(
  props: Readonly<RhfSingleStepWizardProps<T>>,
) => {
  const { wizard, step, children } = props;
  const resolvedPath = useResolvedPath('').pathname;
  const parentPath = useResolvedPath('..').pathname;
  const url = resolvedPath.endsWith(step.location)
    ? resolvedPath.slice(0, -step.location.length) || '/'
    : parentPath;

  const steps = [
    <WizardStep<T> key={step.location} {...step}>
      {children}
    </WizardStep>,
  ] satisfies readonly WizardStepElement[];

  const stepProps = {
    ...wizard,
    ...step,
    allSteps: steps,
    currentStepIndex: 0,
    url,
  } as unknown as RhfWizardRoutedStepProps<FormValues>;

  return (
    <Routes>
      <Route
        path={step.location}
        element={<RhfWizardRoutedStep<FormValues> {...stepProps} />}
      />
      <Route
        path='*'
        key={url}
        element={<Navigate to={`${url}${step.location}`} replace />}
      />
    </Routes>
  );
};

export default RhfSingleStepWizard;
