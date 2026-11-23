import { Navigate } from 'react-router';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { useFormState } from 'react-hook-form';
import { FormStepStatus } from '../../../api/web-api-client';
import { omitUndefined } from '../../../utils/omitUndefined';
import BlockUISpinner from '../../BlockUISpinner';
import SteppedNavigation from '../../SteppedNavigation';
import useBodyClass from '../../Utilities/useBodyClass';
import useHtmlTitle from '../../Utilities/useHtmlTitle';
import ErrorSummary from '../ErrorSummary';
import FormBannerSlot from '../FormBannerSlot';
import RhfForm from '../RhfForm';
import { useRhfFormApi } from '../RhfForm/rhfFormApiContext';
import type {
  FormValues,
  Hideable,
  ModalProps,
  ValidationSchema,
} from '../types';
import RhfUnsavedFormPrompt from '../UnsavedFormPrompt/RhfUnsavedFormPrompt';
import PreviousStepButton from './PreviousStepButton';
import RhfNextStepButton from './RhfNextStepButton';
import type { WizardStepError } from './types';
import { useWizardStepController } from './useWizardStepController';
import type { WizardStepControllerOptions } from './wizardStepContracts';

export interface RhfWizardRoutedStepProps<
  T extends FormValues,
> extends WizardStepControllerOptions<T> {
  title: string;
  location: string;
  initialValues: T;
  validateHard?: ValidationSchema;
  validateSoft?: ValidationSchema;
  hidingFields?: Hideable;
  bannerTitle?: string;
  bannerRefTitle?: string;
  bannerSubTitle?: string;
  canSaveDraft?: boolean;
  showGoToDashboardButton?: boolean;
  showBanner?: boolean;
  isSummaryPage?: boolean;
  showSaveAndNextButton?: boolean;
  confirmationOnSubmission?: ModalProps;
  previousButtonTitle?: string;
  nextButtonTitle?: string;
  lastStepNextButtonTitle?: string;
}

const StepSpinners = ({ isLoading }: Readonly<{ isLoading: boolean }>) => {
  const { isSubmitting } = useFormState();

  return (
    <>
      {isSubmitting && (
        <BlockUISpinner>
          <p>Saving...</p>
        </BlockUISpinner>
      )}
      {isLoading && (
        <BlockUISpinner>
          <p>Loading...</p>
        </BlockUISpinner>
      )}
    </>
  );
};

const StepContent = <T extends FormValues>({
  step,
  errorState,
  cancel,
}: Readonly<{
  step: RhfWizardRoutedStepProps<T>;
  errorState: WizardStepError;
  cancel: () => void;
}>) => {
  const { onFormSubmit } = useRhfFormApi();
  const {
    allSteps,
    currentStepIndex,
    stepStatuses,
    url,
    title,
    isSummaryPage,
    previousButtonTitle,
    nextButtonTitle,
    lastStepNextButtonTitle,
    showSaveAndNextButton,
    confirmationOnSubmission,
    discard,
  } = step;
  const serverErrors = 'details' in errorState ? errorState.details : undefined;
  const finalStep = currentStepIndex === allSteps.length - 1;

  return (
    <Container fluid id='main' role='main' className='px-0' tabIndex={-1}>
      <Container className='py-5'>
        <Row>
          {allSteps.length > 1 && (
            <SteppedNavigation
              id='wizard-stepper-id'
              activeStep={currentStepIndex}
              steps={allSteps.map((item, index) => ({
                completed:
                  stepStatuses.at(index)?.status === FormStepStatus.Completed,
                path: `${url}${item.props.location}`,
                title: item.props.title,
              }))}
            />
          )}
        </Row>
        <Row className='mb-5'>
          <Col sm={12} md={10} lg={8} className='mx-auto'>
            <h1 id='page-title' tabIndex={-1}>
              {title}
            </h1>
            {!isSummaryPage && (
              <p id='form-inst' className='visually-hidden'>
                Form instructions: All form fields are required unless marked
                optional.
              </p>
            )}
            <ErrorSummary
              prefixToRemove='formStep.'
              isWafViolation={errorState.kind === 'wafViolation'}
              {...omitUndefined({
                serverErrors,
                disableLinkedError: isSummaryPage,
              })}
            />
            <form data-testid='form' onSubmit={onFormSubmit} autoComplete='off'>
              {allSteps.at(currentStepIndex)}
              <div className='mt-5 d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                <PreviousStepButton
                  currentStepIndex={currentStepIndex}
                  steps={allSteps.slice()}
                  {...omitUndefined({ title: previousButtonTitle })}
                  url={url}
                  className='me-md-auto order-2 order-md-0'
                />
                {discard?.showCancelButton && (
                  <Button
                    type='button'
                    data-testid='cancel-button'
                    onClick={cancel}
                    variant='tertiary'
                    className='me-md-auto order-2 order-md-0'
                  >
                    <i className='icon-close me-1' aria-hidden='true' />
                    {discard.cancelButtonTitle}
                  </Button>
                )}
                {showSaveAndNextButton !== false && (
                  <RhfNextStepButton
                    finalStep={finalStep}
                    {...omitUndefined({
                      title: finalStep
                        ? lastStepNextButtonTitle
                        : nextButtonTitle,
                      confirmation: finalStep
                        ? confirmationOnSubmission
                        : undefined,
                    })}
                  />
                )}
              </div>
            </form>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

const RhfWizardRoutedStep = <T extends FormValues>(
  props: Readonly<RhfWizardRoutedStepProps<T>>,
) => {
  const {
    initialValues,
    allSteps,
    currentStepIndex,
    url,
    location,
    validateHard,
    validateSoft,
    hidingFields,
    bannerTitle,
    bannerRefTitle,
    bannerSubTitle,
    canSaveDraft,
    showBanner,
    showGoToDashboardButton,
    discard,
  } = props;
  const stepPrefix =
    allSteps.length > 1 ? `Step ${currentStepIndex + 1}: ` : '';
  useHtmlTitle(`${stepPrefix}${bannerTitle ?? ''} | NMI Services portal`);
  useBodyClass('wizard');
  const {
    isLoading,
    stepValues,
    errorState,
    view,
    submitStep,
    saveAndExitStep,
    cancel,
  } = useWizardStepController<T>(props, initialValues);

  if (view.kind === 'navigate') {
    return <Navigate to={view.to} />;
  }
  if (view.kind === 'blank') {
    return null;
  }

  return (
    <RhfForm
      initialValues={stepValues}
      onSubmit={submitStep}
      onSaveAndExit={saveAndExitStep}
      {...omitUndefined({ validateHard, validateSoft, hidingFields })}
    >
      <FormBannerSlot
        showBanner={showBanner !== false}
        title={bannerTitle}
        refTitle={bannerRefTitle}
        subTitle={bannerSubTitle}
        canSaveDraft={canSaveDraft}
        showGoToDashboardButton={showGoToDashboardButton}
        discard={discard}
      />
      <StepSpinners isLoading={isLoading} />
      <RhfUnsavedFormPrompt path={`${url}${location}`} />
      <StepContent step={props} errorState={errorState} cancel={cancel} />
    </RhfForm>
  );
};

export default RhfWizardRoutedStep;
