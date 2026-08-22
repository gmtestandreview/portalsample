import Row from 'react-bootstrap/Row';
import { useLocation, useParams } from 'react-router';
import { Alert, Button } from 'react-bootstrap';
import { useField, useFormikContext, getIn } from 'formik';
import { PatternFormat } from 'react-number-format';
import type { OrganisationAndContactProps } from './types';
import ContactDetailsInput from '../../components/forms/CommonForms/ContactDetails';
import HidableField from '../../components/forms/HidableField';
import RadioButtonGroup from '../../components/Inputs/RadioButtonGroup';
import { formatTradingBranchFromStrings } from '../common/helperFunctions';
import { useModalDispatch } from '../../components/modals/ModalContext';

const GetFieldValue = ({ fieldName }: { fieldName: string }) => {
    const [_field] = useField(fieldName);
    return (
        <>
            {_field.value}
        </>
    );
};

const GetFieldValueString = ({ fieldName }: { fieldName: string }) => {
    const [_field] = useField(fieldName);
    return _field.value;
};

const OrganisationAndContact = (props: OrganisationAndContactProps) => {
    const { isSummary, name } = props;
    const isEditable = !isSummary;
    const { values } = useFormikContext<any>();
    const [sourceReferenceField] = useField('sourceReferenceId');
    const modalDispatch = useModalDispatch();
    const location = useLocation();
    const { id } = useParams();
    const rFQId = id || '';

    function getName(localName: string) {
        return name ? `${name}.${localName}` : localName;
    }

    const isCorrectBranchOrLocation = getIn(values, getName('isCorrectBranchOrLocation')) ?? '';

    const onShowBranchSelectorClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        modalDispatch?.setShowRFQSelectModal(true, rFQId, location.pathname);
    };

    const renderMyContactDetails = () => (
        <>
            <GetFieldValue fieldName={getName('currentContact.title')} />
            {' '}
            <GetFieldValue fieldName={getName('currentContact.firstName')} />
            {' '}
            <GetFieldValue fieldName={getName('currentContact.lastName')} />
            <br />
            <GetFieldValue fieldName={getName('currentContact.email')} />
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
            Enter the contact details of another person. Please ensure this person has access to the NMI Services portal
            for the organisation to progress the request.
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
            Please use the &quot;Change branch/location&quot; below to change this request before proceeding.
            The updated branch/location selection will also be used for your dashboard view.
        </>
    );

    const renderHelpIsCorrectBranchOrLocation = () => (
        <>
            Please ensure you are using the correct branch/location.
            <br aria-hidden='true' />
            <span className='visually-hidden'>
                {renderHelpBranch()}
            </span>
        </>
    );

    return (
        <>
            {isSummary
                ? null
                : (
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
                                The Entity, Business, Branch and/or location name can be used to help you group your NMI Service portal requests for simplified management.
                                Ensure you are using the correct branch/location.
                            </p>
                            {!!sourceReferenceField.value && (
                                <p>
                                    This &quot;Recalibration Request&quot; is prefilled based on the previous original quote request. Please review and update if any
                                    changes are required prior to submitting the new request.
                                </p>
                            )}
                        </div>
                    </Alert>
                )}
            
            <Row className='mb-4'>
                <h2 id='orgDetails' className={isSummary ? 'h3 my-3' : 'mb-0'}>
                    Organisation
                    {isSummary ? '' : ' details'}
                </h2>
            </Row>
            <Row className='mb-4'>
                <h2 className={isSummary ? 'h3 mb-0' : 'h2 text-body mb-0'} aria-describedby='orgABN'>
            {isEditable && (
                        <span className='d-block mb-1 fs-5 fw-normal'>
                            {'Currently managing '}
                        </span>
                    )}
                    <span className='d-block text-break'>
                        {formatTradingBranchFromStrings(GetFieldValueString({ fieldName: getName('businessOrTradingName') }), GetFieldValueString({ fieldName: getName('branchOrLocationName') }))}
                    </span>
                    <span className='d-block text-break'><GetFieldValue fieldName={getName('name')} /></span>
                    <span id='orgABN' className='d-inline-block me-3 fs-5 fw-normal'>
                        {'ABN: '}
                        <PatternFormat
                            value={GetFieldValue({ fieldName: getName('abn') }).props?.children}
                            displayType='text'
                            format='## ### ### ###'
                            aria-hidden='true'
                            role='presentation'
                            valueIsNumericString={false}
                        />
                    </span>
                    <span className='visually-hidden'>
                        {GetFieldValue({ fieldName: getName('abn') }).props?.children?.split('').join(' ')}
                    </span>
                </h2>
            </Row>
            {isEditable && Number.parseInt(GetFieldValueString({ fieldName: getName('organisationCount') }), 10) > 1
                && (
                    <Row className='mb-4'>
                        <RadioButtonGroup
                            legend='Are you creating this request for the correct branch or location above?'
                            name={getName('isCorrectBranchOrLocation')}
                            id='q-isCorrectBranchOrLocation'
                            containerClassName='mb-1'
                            inlineHelp={renderHelpIsCorrectBranchOrLocation()}
                            isSummary={isSummary}
                            options={[
                                {
                                    label: 'Yes, this is the correct branch/location',
                                    descriptor: '',
                                    value: 'Yes',
                                    id: 'isCorrectBranchOrLocation-Yes',
                                },
                                {
                                    label: 'No, update this request to use a different branch/location.',
                                    descriptor: (
                                        <span className='body-mini-text' aria-hidden='true'>
                                            {renderHelpBranch()}
                                        </span>
                                    ),
                                    value: 'No',
                                    id: 'isCorrectBranchOrLocation-No',
                                }]}
                        />
                        <div className='mb-4 px-5'>
                            <Button
                                variant='link'
                                data-testid='open-manage-branch-division-button'
                                role='button'
                                onClick={onShowBranchSelectorClick}
                                className='ms-2'
                                disabled={isCorrectBranchOrLocation !== 'No'}
                            >
                                Change branch/location
                            </Button>
                        </div>
                    </Row>
                )}
            <Row className='mb-4'>
                <h2 className={isSummary ? 'h3 my-3' : ''}>
                    Contact
                    {isSummary ? '' : ' information'}
                </h2>
                <RadioButtonGroup
                    legend='Who is the main contact person for this request?'
                    name={getName('isPrincipalContact')}
                    id='q-isPrincipalContact'
                    inlineHelpTitle='What&apos;s this?'
                    inlineHelp={renderHelpContact()}
                    isSummary={isSummary}
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
                        }]}
                />
                <HidableField name={getName('principalContactHide')}>
                    <ContactDetailsInput
                        key='contact'
                        name={getName('contact')}
                        isSummary={isSummary}
                    />
                </HidableField>
            </Row>
        </>
    );
};

export default OrganisationAndContact;
