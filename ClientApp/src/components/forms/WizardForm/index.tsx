import type { FormikValues } from 'formik';
import React from 'react';
import type { FC } from 'react';
import {
    Navigate,
    Route, Routes, useResolvedPath,
} from 'react-router';
import type { WizardFormProps, WizardStepProps } from './types';
import WizardRoutedStep from './WizardRoutedStep';

const WizardForm: FC<WizardFormProps> = (props: WizardFormProps) => {
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

    const reactChildren: React.ReactElement<WizardStepProps<FormikValues>>[] = [];
    React.Children.forEach(children, (child) => {
        if (!React.isValidElement<WizardStepProps<FormikValues>>(child)) {
            throw new Error('WizardForm only accepts children of type WizardStep');
        }
        reactChildren.push(child);
    });

    const url = reactChildren.reduce((basePath, step) => (
        resolvedPath.endsWith(step.props.location)
            ? resolvedPath.slice(0, -step.props.location.length) || '/'
            : basePath
    ), parentPath);

    return (
        <Routes>
            {reactChildren.map((step, index) => {
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
                return (
                    <Route
                        key={location}
                        path={location}
                        element={(
                            <WizardRoutedStep
                                allSteps={reactChildren.slice()}
                                currentStepIndex={index}
                                initialValues={initialValues}
                                location={location}
                                isSummaryPage={isSummaryPage}
                                locationAfterExit={locationAfterExit}
                                locationOnCompletion={locationOnCompletion}
                                onSaveAndExit={onSaveAndExit}
                                onSaveAndNext={onSaveAndNext}
                                title={title}
                                lastStepNextButtonTitle={lastStepNextButtonTitle}
                                stepStatuses={stepStatuses}
                                loadStepValues={loadStepValues}
                                nextButtonTitle={nextButtonTitle}
                                previousButtonTitle={previousButtonTitle}
                                validateHard={validateHard}
                                validateSoft={validateSoft}
                                url={url}
                                hidingFields={hidingFields}
                                bannerTitle={bannerTitle}
                                bannerRefTitle={bannerRefTitle}
                                bannerSubTitle={bannerSubTitle}
                                canSaveDraft={canSaveDraft}
                                showSaveAndNextButton={showSaveAndNextButton}
                                showGoToDashboardButton={showGoToDashboardButton}
                                discard={discard}
                                getRedirectionLocationOnError={getRedirectionLocationOnError}
                                showBanner={showBanner}
                                confirmationOnSubmission={confirmationOnSubmission}
                            />
                        )}
                    />
                );
            })}
            <Route
                path='*'
                key={url}
                element={(
                    <Navigate to={`${url}${reactChildren.at(-1)?.props.location}`} replace />
                )}
            />
        </Routes>
    );
};

export default WizardForm;
