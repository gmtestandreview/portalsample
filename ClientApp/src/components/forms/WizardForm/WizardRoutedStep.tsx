 
import {
    useCallback, useEffect, useRef, useState,
} from 'react';
import {
    Navigate, useNavigate,
} from 'react-router';
import type { FormikHelpers, FormikValues } from 'formik';
import {
    Container,
    Row,
    Col,
    Form,
    Button,
} from 'react-bootstrap';
import { isEqual } from 'lodash';
import { SeverityLevel } from '@microsoft/applicationinsights-common';
import { ErrorType } from './types';
import type { WizardRoutedStepProps, WizardStepProps, WizardStepError } from './types';
import { resolveErrorState } from './errorState';
import SteppedNavigation from '../../SteppedNavigation';
import PreviousStepButton from './PreviousStepButton';
import NextStepButton from './NextStepButton';
import ErrorSummary from '../ErrorSummary';
import type { InitialValue } from '../../../types';
import { FormStepStatus } from '../../../api/web-api-client';
import type { ProblemDetails } from '../../../api/web-api-client';
import FormikForm from '../FormikForm';
import { nullOrUndefinedToEmpty } from '../../../utils';
import useHtmlTitle from '../../Utilities/useHtmlTitle';
import useBodyClass from '../../Utilities/useBodyClass';
import { setDashboardNotification, setGetStartedNotification } from '../../../storage/notification';
import { NotificationSeverity } from '../../../storage/types';
import { useAccountState, useAccountDispatch } from '../../../authentication/hooks';
import { env } from '../../../env';
import AppLogger from '../../../instrumentation/AppLogger';

interface StepState<T extends FormikValues> {
    values: InitialValue<T>;
}

const WizardRoutedStep = (props: WizardRoutedStepProps<FormikValues>) => {
    const {
        initialValues,
        location,
        validateHard,
        validateSoft,
        stepStatuses,
        loadStepValues,
        locationAfterExit,
        locationOnCompletion,
        currentStepIndex,
        allSteps,
        nextButtonTitle,
        title,
        lastStepNextButtonTitle,
        previousButtonTitle,
        url,
        hidingFields,
        onSaveAndExit,
        onSaveAndNext,
        bannerTitle,
        bannerRefTitle,
        bannerSubTitle,
        canSaveDraft,
        showSaveAndNextButton,
        showGoToDashboardButton,
        showBanner,
        getRedirectionLocationOnError,
        discard,
        confirmationOnSubmission,
        isSummaryPage,
    } = props;

    const stepPrefix = allSteps.length > 1 ? `Step ${currentStepIndex + 1}: ` : '';
    useHtmlTitle(`${stepPrefix}${bannerTitle} | NMI Services portal`);
    useBodyClass('wizard');
    const navigate = useNavigate();
    const accountState = useAccountState();
    const accountDispatch = useAccountDispatch();
    const controllerRef = useRef<AbortController | null>();
    const abortSignal = () => {
        const controller = new AbortController();
        controllerRef.current = controller;
    };

    const [stepState, setStepState] = useState<StepState<InitialValue<FormikValues>>>({
        values: { ...initialValues },
    });

    const [isLoading, setIsLoading] = useState(true);
    const [errorState, setErrorState] = useState<WizardStepError>({ kind: 'none' });

    const loadData = useCallback(async () => {
        setErrorState({ kind: 'none' });
        try {
            abortSignal();
            const currentStep = await loadStepValues(controllerRef.current?.signal);
            const values = nullOrUndefinedToEmpty(currentStep.stepValues);
            setStepState({ values });
        } catch (error) {
            const err = error as Error;
            AppLogger.error('Could not load data for form step.', err);
            const loadServerError = error as ProblemDetails;
            AppLogger.trace('Could not load data for form step.', SeverityLevel.Error, { problemDetails: loadServerError, err });
            setErrorState(resolveErrorState(error, getRedirectionLocationOnError, ErrorType.Load));
            AppLogger.error('Failed to Load step values', err);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadStepValues]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (errorState.kind === 'concurrency') {
            loadData();
        }
    }, [errorState.kind, loadData]);

    useEffect(() => {
        if (errorState.kind === 'noThirdPartyAccess') {
            setDashboardNotification({
                message: 'You no longer have access to the records for'
                    + ` ${accountState?.details?.targetOrganisation?.targetOrganisationName}. Your changes have not been saved.`,
                severity: NotificationSeverity.Error,
            });
            if (accountDispatch) {
                accountDispatch.setTargetOrganisation(
                    accountState?.details?.abn ?? '',
                    accountState?.details?.organisation ?? '',
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

    const nextStep = currentStepIndex < allSteps.length - 1
        ? allSteps[currentStepIndex + 1]
        : false;

    const goToStep = (
        step: React.ReactElement<WizardStepProps<FormikValues>, string | React.JSXElementConstructor<any>>,
        baseUrl?: string,
    ) => ((baseUrl && url !== baseUrl)
        ? navigate(`${baseUrl}${step.props.location}`, { replace: true })
        : navigate(`${url}${step.props.location}`));

    const onSubmitStep = async (
        values: FormikValues,
        formikHelpers: FormikHelpers<FormikValues>,
    ) => {
        if (onSaveAndNext) {
            abortSignal();
            setErrorState({ kind: 'none' });
            try {
                const isDirty = !isEqual(stepState.values, values);
                const result = await onSaveAndNext(
                    values,
                    isDirty,
                    formikHelpers,
                    controllerRef.current?.signal,
                );
                // Immutable update: replace the DTO at currentStepIndex with a new
                // object, rather than mutating the existing one in place.
                stepStatuses[currentStepIndex] = {
                    ...stepStatuses[currentStepIndex],
                    status: FormStepStatus.Completed,
                };
                if (nextStep) {
                    goToStep(nextStep, result?.baseUrl);
                } else {
                    navigate(locationOnCompletion);
                }
            } catch (error) {
                const _err = error as Error;
                AppLogger.error('Could not submit form step.', error as Error, { stepIndex: currentStepIndex });
                const saveServerError = error as ProblemDetails;
                AppLogger.trace('Could not submit form step.', SeverityLevel.Error, { stepIndex: currentStepIndex, problemDetails: { status: saveServerError?.status, title: saveServerError?.title } });
                setErrorState(resolveErrorState(error, getRedirectionLocationOnError, ErrorType.Update));
            }
        }
    };

    const onSaveAndExitStep = async (
        values: FormikValues,
        formikHelpers: FormikHelpers<FormikValues>,
    ) => {
        if (onSaveAndExit) {
            abortSignal();
            setErrorState({ kind: 'none' });
            try {
                const isDirty = !isEqual(stepState.values, values);
                await onSaveAndExit(
                    values,
                    isDirty,
                    formikHelpers,
                    controllerRef.current?.signal,
                );
                navigate(locationAfterExit || '/');
            } catch (error) {
                const err = error as Error;
                AppLogger.error('Could not save form step.', err, { stepIndex: currentStepIndex });
                const saveServerError = error as ProblemDetails;
                AppLogger.trace('Could not save form step.', SeverityLevel.Error, { stepIndex: currentStepIndex, problemDetails: { status: saveServerError?.status, title: saveServerError?.title } });
                setErrorState(resolveErrorState(error, getRedirectionLocationOnError, ErrorType.Update));
            }
        } else {
            navigate(locationAfterExit || '/');
        }
    };

    const onCancelClick = () => {
        if (discard?.onDiscard) {
            discard.onDiscard();
        }
        // New option for Wizard footer Cancel button
        if (discard?.onCancel) {
            discard.onCancel();
        }
        const discardLocation = discard?.locationOnDiscard;
        if (discardLocation?.startsWith('https://')) {
            globalThis.location.replace(env.EXTERNAL_REDIRECT_URL);
            return;
        }
        navigate((discard?.locationOnCancel || discardLocation) || '/');
    };

    if (errorState.kind === 'redirect') {
        return <Navigate to={errorState.location} />;
    }

    if (errorState.kind === 'notFound') {
        return <Navigate to='/not-found' />;
    }

    if (errorState.kind === 'loading') {
        return <Navigate to='/server-error' />;
    }

    if (errorState.kind === 'noThirdPartyAccess') {
        return <Navigate to='/dashboard' />;
    }

    if (errorState.kind === 'gone') {
        return null;
    }

    if (!isLoading && currentStepIndex > 0) {
        const firstIncompleteStepIndex = stepStatuses.findIndex((x) => x.status !== FormStepStatus.Completed);
        if (firstIncompleteStepIndex !== -1 && firstIncompleteStepIndex < currentStepIndex) {
            return <Navigate to={`${url}${allSteps[firstIncompleteStepIndex].props.location}`} />;
        }
    }

    return (
        <FormikForm<FormikValues>
            initialValues={stepState.values}
            onSubmit={onSubmitStep}
            validateHard={validateHard}
            validateSoft={validateSoft}
            isLoading={isLoading}
            promptPath={`${url}${location}`}
            hidingFields={hidingFields}
            onSaveAndExit={onSaveAndExitStep}
            bannerTitle={bannerTitle}
            bannerRefTitle={bannerRefTitle}
            bannerSubTitle={bannerSubTitle}
            canSaveDraft={canSaveDraft}
            showGoToDashboardButton={showGoToDashboardButton}
            showBanner={showBanner || showBanner === undefined}
            discard={discard}
            isSummaryPage={isSummaryPage}
        >
            { (formik) => (
                <Container fluid id='main' role='main' className='px-0' tabIndex={-1}>
                    <Container className='py-5'>
                        <Row>
                            { allSteps.length > 1 && (
                                <SteppedNavigation
                                    id='wizard-stepper-id'
                                    activeStep={currentStepIndex}
                                    steps={allSteps.map((s, i) => ({
                                        completed: stepStatuses[i].status === FormStepStatus.Completed,
                                        path: `${url}${s.props.location}`,
                                        title: s.props.title,
                                    }))}
                                />
                            )}
                        </Row>
                        <Row className='mb-5'>
                            <Col sm={12} md={10} lg={8} className='mx-auto'>
                                <h1 id='page-title' tabIndex={-1}>
                                    {allSteps.length > 1 && (
                                        <span className='visually-hidden'>
                                            {`Step ${currentStepIndex + 1} of ${allSteps.length} `}
                                        </span>
                                    )}
                                    {title}
                                </h1>
                                {!isSummaryPage && (
                                    <p id='form-inst' className='visually-hidden'>
                                        Form instructions: All form fields are required unless marked optional.
                                    </p>
                                )}
                                <ErrorSummary
                                    serverErrors={
                                        errorState.kind === 'serverError'
                                        || errorState.kind === 'wafViolation'
                                        || errorState.kind === 'concurrency'
                                            ? errorState.details
                                            : undefined
                                    }
                                    prefixToRemove='formStep.'
                                    disableLinkedError={isSummaryPage}
                                    isWafViolation={errorState.kind === 'wafViolation'}
                                />
                                <Form
                                    data-testid='form'
                                    onSubmit={formik.handleSubmit}
                                    autoComplete='off'
                                >
                                    {allSteps[currentStepIndex]}
                                    <div className='mt-5 d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                                        <PreviousStepButton
                                            currentStepIndex={currentStepIndex}
                                            steps={allSteps.slice()}
                                            title={previousButtonTitle}
                                            url={url}
                                            className='me-md-auto order-2 order-md-0'
                                        />
                                        {discard?.showCancelButton ? (
                                            <Button
                                                data-testid='cancel-button'
                                                onClick={() => onCancelClick()}
                                                variant='tertiary'
                                                className='me-md-auto order-2 order-md-0'
                                            >
                                                <i className='icon-close me-1' aria-hidden='true' />
                                                {discard.cancelButtonTitle}
                                            </Button>
                                        ) : null}
                                        {showSaveAndNextButton === false ? null : (
                                            <NextStepButton
                                                currentStepIndex={currentStepIndex}
                                                steps={allSteps.slice()}
                                                title={nextButtonTitle}
                                                finalStepTitle={lastStepNextButtonTitle}
                                                finalStepConfirmation={confirmationOnSubmission}
                                                className='ms-md-auto'
                                            />
                                        )}
                                    </div>
                                </Form>
                            </Col>
                        </Row>
                    </Container>
                </Container>
            )}
        </FormikForm>
    );
};

export default WizardRoutedStep;
