import Row from 'react-bootstrap/Row';
import { useLocation, useParams } from 'react-router';
import { Alert, Button } from 'react-bootstrap';
import { useFormikContext } from 'formik';
import { PatternFormat } from 'react-number-format';
import ContactDetailsInput from '../../components/forms/CommonForms/ContactDetails';
import HidableField from '../../components/forms/HidableField';
import RadioButtonGroup from '../../components/Inputs/RadioButtonGroup';
import { formatTradingBranchFromStrings } from '../common/helperFunctions';
import { useModalDispatch } from '../../components/modals/ModalContext';
import { YesNo } from '../../api/web-api-client';
import type { OrganisationAndContact as OrganisationAndContactValues } from '../../api/web-api-client';

const OrganisationAndContact = () => {
  const { values } = useFormikContext<OrganisationAndContactValues>();
  const {
    sourceReferenceId,
    abn,
    name,
    businessOrTradingName,
    branchOrLocationName,
    organisationCount,
    currentContact,
  } = values;
  const modalDispatch = useModalDispatch();
  const location = useLocation();
  const { id } = useParams();
  const rFQId = id || '';

  const isCorrectBranchOrLocation = values.isCorrectBranchOrLocation;

  const onShowBranchSelectorClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    modalDispatch?.setShowRFQSelectModal(true, rFQId, location.pathname);
  };

  const renderMyContactDetails = () => (
    <>
      {currentContact?.title} {currentContact?.firstName}{' '}
      {currentContact?.lastName}
      <br />
      {currentContact?.email}
      <br />
    </>
  );

  const renderHelpUseMyContact = () => (
    <>
      To update your contact details go to
      <br />
      Dashboard &gt;
      {'  Settings menu '}
      <i className='icon-settings me-1' />
      &gt;
      {' My contact details '}
    </>
  );

  const renderHelpUseOtherContact = () => (
    <>
      Enter the contact details of another person. Please ensure this person has
      access to the NMI Services portal for the organisation to progress the
      request.
    </>
  );

  const renderHelpContact = () => (
    <div className='text-small'>
      For the following options:
      <ul>
        <li className=''>
          Use my contact details
          <br />
          {renderHelpUseMyContact()}
        </li>
        <li>
          A different contact person
          <br />
          {renderHelpUseOtherContact()}
        </li>
      </ul>
    </div>
  );

  const renderHelpBranch = () => (
    <>
      Please use the &quot;Change branch/location&quot; below to change this
      request before proceeding. The updated branch/location selection will also
      be used for your dashboard view.
    </>
  );

  const renderHelpIsCorrectBranchOrLocation = () => (
    <>
      Please ensure you are using the correct branch/location.
      <br aria-hidden='true' />
      <span className='visually-hidden'>{renderHelpBranch()}</span>
    </>
  );

  return (
    <>
      <Alert
        variant='info'
        data-testid='info-summary'
        role='status'
        aria-live='polite'
        className='d-flex mb-4'
      >
        <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
          <div className='bgCircle mb-3 me-3'>
            <i className='icon-info' aria-hidden='true' />
          </div>
        </div>
        <div>
          <p className='mb-0'>
            <strong>Important information</strong>
          </p>
          <p>
            The Entity, Business, Branch and/or location name can be used to
            help you group your NMI Service portal requests for simplified
            management. Ensure you are using the correct branch/location.
          </p>
          {!!sourceReferenceId && (
            <p>
              This &quot;Recalibration Request&quot; is prefilled based on the
              previous original quote request. Please review and update if any
              changes are required prior to submitting the new request.
            </p>
          )}
        </div>
      </Alert>

      <Row className='mb-4'>
        <h2 id='orgDetails' className='mb-0'>
          Organisation details
        </h2>
      </Row>
      <Row className='mb-4'>
        <h2 className='h2 text-body mb-0' aria-describedby='orgABN'>
          <span className='d-block mb-1 fs-5 fw-normal'>
            {'Currently managing '}
          </span>
          <span className='d-block text-break'>
            {formatTradingBranchFromStrings(
              businessOrTradingName ?? '',
              branchOrLocationName ?? '',
            )}
          </span>
          <span className='d-block text-break'>{name}</span>
          <span id='orgABN' className='d-inline-block me-3 fs-5 fw-normal'>
            {'ABN: '}
            <PatternFormat
              value={abn ?? null}
              displayType='text'
              format='## ### ### ###'
              aria-hidden='true'
              role='presentation'
              valueIsNumericString={false}
            />
          </span>
          <span className='visually-hidden'>{abn?.split('').join(' ')}</span>
        </h2>
      </Row>
      {Number.parseInt(String(organisationCount ?? ''), 10) > 1 && (
        <Row className='mb-4'>
          <RadioButtonGroup
            legend='Are you creating this request for the correct branch or location above?'
            name='isCorrectBranchOrLocation'
            id='q-isCorrectBranchOrLocation'
            containerClassName='mb-1'
            inlineHelp={renderHelpIsCorrectBranchOrLocation()}
            options={[
              {
                label: 'Yes, this is the correct branch/location',
                descriptor: '',
                value: 'Yes',
                id: 'isCorrectBranchOrLocation-Yes',
              },
              {
                label:
                  'No, update this request to use a different branch/location.',
                descriptor: (
                  <span className='body-mini-text' aria-hidden='true'>
                    {renderHelpBranch()}
                  </span>
                ),
                value: 'No',
                id: 'isCorrectBranchOrLocation-No',
              },
            ]}
          />
          <div className='mb-4 px-5'>
            <Button
              variant='link'
              data-testid='open-manage-branch-division-button'
              role='button'
              onClick={onShowBranchSelectorClick}
              className='ms-2'
              disabled={isCorrectBranchOrLocation !== YesNo.No}
            >
              Change branch/location
            </Button>
          </div>
        </Row>
      )}
      <Row className='mb-4'>
        <h2 className=''>Contact information</h2>
        <RadioButtonGroup
          legend='Who is the main contact person for this request?'
          name='isPrincipalContact'
          id='q-isPrincipalContact'
          inlineHelpTitle="What's this?"
          inlineHelp={renderHelpContact()}
          options={[
            {
              label: 'Use my contact details',
              descriptor: (
                <>
                  <span className='body-mini-text'>
                    {renderMyContactDetails()}
                  </span>
                  <span className='body-mini-text' aria-hidden='true'>
                    {renderHelpUseMyContact()}
                  </span>
                </>
              ),
              value: 'Yes',
              id: 'isPrincipalContact-Yes',
            },
            {
              label: 'A different contact person',
              descriptor: (
                <span className='body-mini-text' aria-hidden='true'>
                  {renderHelpUseOtherContact()}
                </span>
              ),
              value: 'No',
              id: 'isPrincipalContact-No',
            },
          ]}
        />
        <HidableField name='principalContactHide'>
          <ContactDetailsInput key='contact' name='contact' />
        </HidableField>
      </Row>
    </>
  );
};

export default OrganisationAndContact;
