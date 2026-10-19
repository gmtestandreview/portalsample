import { Navigate } from 'react-router';
import type { FormikValues } from 'formik';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import type { WizardRoutedStepProps } from './types';
import { useWizardStepController } from './useWizardStepController';
import SteppedNavigation from '../../SteppedNavigation';
import PreviousStepButton from './PreviousStepButton';
import NextStepButton from './NextStepButton';
import ErrorSummary from '../ErrorSummary';
import { FormStepStatus } from '../../../api/web-api-client';
import FormikForm from '../FormikForm';
import useHtmlTitle from '../../Utilities/useHtmlTitle';
import useBodyClass from '../../Utilities/useBodyClass';
import { omitUndefined } from '../../../utils/omitUndefined';

const WizardRoutedStep = (
  props: Readonly<WizardRoutedStepProps<FormikValues>>
) => {
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

  const stepPrefix =
    allSteps.length > 1 ? `Step ${currentStepIndex + 1}: ` : '';
  useHtmlTitle(`${stepPrefix}${bannerTitle} | NMI Services portal`);
  useBodyClass('wizard');
  const {
    isLoading,
    stepValues,
    errorState,
    view,
    submitStep,
    saveAndExitStep,
    cancel,
  } = useWizardStepController(
    {
      stepStatuses,
      loadStepValues,
      locationOnCompletion,
      currentStepIndex,
      allSteps,
      url,
      ...omitUndefined({
        discard,
        locationAfterExit,
        onSaveAndExit,
        onSaveAndNext,
        getRedirectionLocationOnError,
      }),
    },
    initialValues
  );

  if (view.kind === 'navigate') {
    return <Navigate to={view.to} />;
  }

  if (view.kind === 'blank') {
    return null;
  }

  return (
    <FormikForm<FormikValues>
      initialValues={stepValues}
      onSubmit={submitStep}
      isLoading={isLoading}
      promptPath={`${url}${location}`}
      onSaveAndExit={saveAndExitStep}
      showBanner={showBanner || showBanner === undefined}
      {...omitUndefined({
        validateHard,
        validateSoft,
        hidingFields,
        bannerTitle,
        bannerRefTitle,
        bannerSubTitle,
        canSaveDraft,
        showGoToDashboardButton,
        discard,
        isSummaryPage,
      })}
    >
      {(formik) => (
        <Container fluid id='main' role='main' className='px-0' tabIndex={-1}>
          <Container className='py-5'>
            <Row>
              {allSteps.length > 1 && (
                <SteppedNavigation
                  id='wizard-stepper-id'
                  activeStep={currentStepIndex}
                  steps={allSteps.map((s, i) => ({
                    completed:
                      stepStatuses[i]?.status === FormStepStatus.Completed,
                    path: `${url}${s.props.location}`,
                    title: s.props.title,
                  }))}
                />
              )}
            </Row>
            <Row className='mb-5'>
              <Col sm={12} md={10} lg={8} className='mx-auto'>
                {/*
                 * Progress is announced once, by SteppedNavigation. This
                 * heading used to repeat it as a visually-hidden
                 * "Step N of M", which was harmless only while the stepper
                 * was aria-hidden. The stepper now carries focusable links
                 * and is exposed, so keeping both would announce the same
                 * position twice.
                 */}
                <h1 id='page-title' tabIndex={-1}>
                  {title}
                </h1>
                {!isSummaryPage && (
                  <p id='form-inst' className='visually-hidden'>
                    Form instructions: All form fields are required unless
                    marked optional.
                  </p>
                )}
                <ErrorSummary
                  {...omitUndefined({
                    serverErrors:
                      errorState.kind === 'serverError' ||
                      errorState.kind === 'wafViolation' ||
                      errorState.kind === 'concurrency'
                        ? errorState.details
                        : undefined,
                    disableLinkedError: isSummaryPage,
                  })}
                  prefixToRemove='formStep.'
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
                      {...omitUndefined({ title: previousButtonTitle })}
                      url={url}
                      className='me-md-auto order-2 order-md-0'
                    />
                    {discard?.showCancelButton ? (
                      <Button
                        data-testid='cancel-button'
                        onClick={() => cancel()}
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
                        {...omitUndefined({
                          title: nextButtonTitle,
                          finalStepTitle: lastStepNextButtonTitle,
                          finalStepConfirmation: confirmationOnSubmission,
                        })}
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
