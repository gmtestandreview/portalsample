import React from 'react';
import type { FC } from 'react';
import { Navigate, Route, Routes, useResolvedPath } from 'react-router';
import { omitUndefined } from '../../../utils/omitUndefined';
import type { FormValues } from '../types';
import RhfWizardRoutedStep from './RhfWizardRoutedStep';
import type { RhfWizardRoutedStepProps } from './RhfWizardRoutedStep';
import type { WizardFormProps, WizardStepProps } from './types';
import type { WizardStepElement } from './wizardStepContracts';

const flattenChildren = (
  children: React.ReactNode,
  isRoot = true,
): React.ReactNode[] => {
  if (children === null || children === undefined) {
    return isRoot ? [] : [children];
  }
  if (Array.isArray(children)) {
    const childArray = children as React.ReactNode[];
    return childArray.flatMap((child) => flattenChildren(child, false));
  }
  return [children];
};

/**
 * React Hook Form counterpart of `WizardForm`: one route per `WizardStep` child,
 * each rendered by `RhfWizardRoutedStep`, with unknown paths redirected to the
 * last step.
 */
const RhfWizardForm: FC<WizardFormProps> = (
  props: Readonly<WizardFormProps>,
) => {
  const {
    children,
    lastStepNextButtonTitle,
    nextButtonTitle,
    previousButtonTitle,
    locationAfterExit,
    locationOnCompletion,
    canSaveDraft,
    showSaveAndNextButton,
    showGoToDashboardButton,
    showBanner,
    confirmationOnSubmission,
  } = props;

  const resolvedPath = useResolvedPath('').pathname;
  const parentPath = useResolvedPath('..').pathname;

  const steps = flattenChildren(children).map((child) => {
    if (!React.isValidElement<WizardStepProps<FormValues>>(child)) {
      throw new Error('RhfWizardForm only accepts children of type WizardStep');
    }
    return child;
  });

  const url = steps.reduce(
    (basePath, step) =>
      resolvedPath.endsWith(step.props.location)
        ? resolvedPath.slice(0, -step.props.location.length) || '/'
        : basePath,
    parentPath,
  );
  const allSteps: readonly WizardStepElement[] = steps;

  return (
    <Routes>
      {steps.map((step, index) => {
        const {
          initialValues,
          location,
          onSaveAndExit,
          onSaveAndNext,
          validateHard,
          validateSoft,
          stepStatuses,
          loadStepValues,
          title,
          hidingFields,
          bannerTitle,
          bannerRefTitle,
          bannerSubTitle,
          getRedirectionLocationOnError,
          isSummaryPage,
          discard,
        } = step.props;
        const stepProps: RhfWizardRoutedStepProps<FormValues> = {
          allSteps,
          currentStepIndex: index,
          initialValues,
          location,
          locationOnCompletion,
          title,
          stepStatuses,
          loadStepValues,
          url,
          ...omitUndefined({
            isSummaryPage,
            locationAfterExit,
            onSaveAndExit,
            onSaveAndNext,
            lastStepNextButtonTitle,
            nextButtonTitle,
            previousButtonTitle,
            validateHard,
            validateSoft,
            hidingFields,
            bannerTitle,
            bannerRefTitle,
            bannerSubTitle,
            canSaveDraft,
            showSaveAndNextButton,
            showGoToDashboardButton,
            discard,
            getRedirectionLocationOnError,
            showBanner,
            confirmationOnSubmission,
          }),
        };

        return (
          <Route
            key={location}
            path={location}
            element={<RhfWizardRoutedStep<FormValues> {...stepProps} />}
          />
        );
      })}
      <Route
        path='*'
        key={url}
        element={
          <Navigate to={[url, steps.at(-1)?.props.location].join('')} replace />
        }
      />
    </Routes>
  );
};

export default RhfWizardForm;
