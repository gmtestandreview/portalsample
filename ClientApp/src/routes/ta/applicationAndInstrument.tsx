import { useField, useFormikContext } from 'formik';
import Row from 'react-bootstrap/Row';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMsal } from '@azure/msal-react';
import {
    Alert, Card, Col, Container,
} from 'react-bootstrap';
import { forEach } from 'lodash';
import HidableField from '../../components/forms/HidableField';
import SelectInput from '../../components/Inputs/SelectInput';
import TextAreaInput from '../../components/Inputs/TextAreaInput';
import type { TAApplicationAndInstrumentProps } from './types';
import {
    type LookupResponse,
    PatternApprovalRequiredValueOptions,
    PatternApprovalRequiredValues,
} from '../../api/web-api-client';
import type { SelectInputOption } from '../../components/Inputs/SelectInput/types';
import CheckboxGroup from '../../components/Inputs/CheckboxGroup';
import AppLogger from '../../instrumentation/AppLogger';
import CertificateNumberLookup from '../../components/Inputs/CertificateNumberLookup';
import RadioButton from '../../components/Inputs/RadioButton';
import InstrumentInfoPanel from './instrumentInfoPanel';
import TextInput from '../../components/Inputs/TextInput';
import { sortList } from '../common/helperFunctions';
import SummaryDisplay from '../../components/SummaryDisplay';
import BlockUISpinner from '../../components/BlockUISpinner';

export const applicationTypes = [
    {
        key: 'new',
        id: 'appl-new',
        label: 'New Certificate of Approval (CoA)',
        value: PatternApprovalRequiredValues.NewCertificate,
    },
    {
        key: 'var',
        id: 'appl-var',
        label: 'Variation or request a minor edit',
        value: PatternApprovalRequiredValues.Variation,
    },
    {
        key: 'oth',
        id: 'appl-oth',
        label: 'Other options',
        value: PatternApprovalRequiredValues.OtherApproval,
    },
];

export const newCertificateSubOptions = [
    {
        label: 'NMI Pattern Approval Certificate',
        value: PatternApprovalRequiredValueOptions.CertificateofApproval,
        id: 'q-appl-new-nmiapprcert',
        descriptor: 'Certificate of approval for a new instrument intended for trade use in Australia',
    },
    {
        label: 'International Organisation of Legal Metrology (OIML) Certificate',
        value: PatternApprovalRequiredValueOptions.OIMLCertificate,
        id: 'q-appl-new-oimlcert',
        descriptor: 'For potential recognition by overseas authorities and applicable to certain approved categories',
    },
    {
        label: 'Conversion Certificate',
        value: PatternApprovalRequiredValueOptions.ConversionCertificate,
        id: 'q-appl-new-convercert',
        descriptor: 'In conjunction with General Certificate 6B/0',
    },
];

export const variationSubOptions = [
    {
        label: 'Variation',
        value: PatternApprovalRequiredValueOptions.VariationtoanExistingCoA,
        id: 'q-appl-var-variation',
        descriptor: 'Add models or make changes to approved instruments',
    },
    {
        label: 'Certificate edits',
        value: PatternApprovalRequiredValueOptions.AmendmenttoanExistingCoA,
        id: 'q-appl-var-cert-edits',
        descriptor: 'Minor editorial changes that do not alter metrological specifications',
    },
];

export const otherApprovalSubOptions = [
    {
        label: 'Review of an approval',
        value: PatternApprovalRequiredValueOptions.ReviewofApproval,
        id: 'q-appl-oth-reviewappr',
        descriptor: 'Triggered by significant changes to approval requirements',
    },
    {
        label: 'Provisional',
        value: PatternApprovalRequiredValueOptions.ProvisionalCertificate,
        id: 'q-appl-oth-prov',
        descriptor: 'Provisional certificate of approval while your full application is in progress',
    },
    {
        label: 'Certificate cancellation',
        value: PatternApprovalRequiredValueOptions.CertificateCancellation,
        id: 'q-appl-oth-withdrawcert',
        descriptor: 'Discontinue an existing certificate',
    },
];

const ApplicationAndInstrument = (props: TAApplicationAndInstrumentProps) => {
    const { isSummary, name } = props;
    const getName = (localName: string) => (name ? `${name}.${localName}` : localName);
    const context = useFormikContext();
    const { accounts, instance } = useMsal();
    const [isDataLoading, setIsDataLoading] = useState(false);
    const initialKey = context.getFieldMeta('patternApprovalType').initialValue as string | null;
    const [selectedApplication, setSelectedApplication] = useState<string | null>(() => initialKey || 'new');
    const [instrumentCategories, setInstrumentCategories] = useState<LookupResponse[]>();
    const [instrumentTypes, setInstrumentTypes] = useState<LookupResponse[]>();
    const [instrumentTypesSelected, setInstrumentTypesSelected] = useState<SelectInputOption<string>[]>();
    const noInstrumentCategoriestId = useRef('');
    const noInstrumentTypeId = useRef('');

    // Lookup values are loaded in the parent component and passed through Formik context, so we can access them via context.values
    // without needing to make separate API calls here. We just need to transform them into the format needed for the dropdowns.
    const [_instrumentTypeField, _instrumentTypeMeta] = useField(getName('instrumentType'));
    const [_instrumentCatField, _instrumentCatMeta] = useField(getName('instrumentCategory'));
    const [_typeLookupField, _typeLookupMeta] = useField(getName('instrumentTypeLookup'));
    const [_categoryLookupField, _categoryLookupMeta] = useField(getName('instrumentCategoryLookup'));

    const [isInstrumentTypeDisabled, setIsInstrumentTypeDisabled] = useState(false);

    const getInstrumentTypes = (values: LookupResponse[], parentId: string): SelectInputOption<string>[] => {
        const options: SelectInputOption<string>[] = [];
        if (parentId !== undefined && parentId !== '') {
            forEach(values, (l) => {
                if (l.parentId === parentId) {
                    options.push({ displayText: l.label!, value: l.id! });
                }
            });
        } else if (isSummary) {
            forEach(values, (l) => {
                options.push({ displayText: l.label!, value: l.id! });
            });
        }
        const [sorted, lastId] = sortList(options, 'No instrument', 'displayText');
        noInstrumentTypeId.current = lastId;

        return sorted;
    };

    // Sync selectedApplication with Formik's patternApprovalType value
    useEffect(() => {
        // Sync selectedApplication with initialKey, but only if initialKey is defined and different
        if (!initialKey) {
            setIsDataLoading(true);
        } else if (initialKey !== selectedApplication) {
            setIsDataLoading(true);
            setSelectedApplication(initialKey);
            setIsDataLoading(false);
        } else {
            setIsDataLoading(false);
        }
    }, [initialKey, selectedApplication]);

    useEffect(() => {
        const loadInstrumentCategories = async () => {
            try {
                if (!instrumentCategories) {
                    const result = _categoryLookupField.value as LookupResponse[];
                    const artefactTypeResult = _typeLookupField.value as LookupResponse[];
                    if (result && artefactTypeResult) {
                        const [sorted, lastId] = sortList(result, 'No measurement', 'label');
                        noInstrumentCategoriestId.current = lastId;
                        setInstrumentCategories(sorted);
                        setInstrumentTypes(artefactTypeResult);
                        if ((artefactTypeResult !== undefined && _instrumentTypeField.value !== undefined) || isSummary) {
                            setInstrumentTypesSelected(getInstrumentTypes(artefactTypeResult, _instrumentCatField.value as string));
                            if (!isSummary && (_instrumentCatField.value as string) === noInstrumentCategoriestId.current) setIsInstrumentTypeDisabled(true);
                        } else {
                            setInstrumentTypesSelected([]);
                        }
                    } else {
                        setInstrumentTypesSelected([]);
                    }
                }
            } catch (e) {
                AppLogger.error('Failed to retrieve look ups', e as Error);
            }
        };
        // if (!isLoadingInstrumentCategories.current) {
        loadInstrumentCategories();
        // }
        // return () => { isLoadingInstrumentCategories.current = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_categoryLookupField.value, _typeLookupField.value, accounts, instance, instrumentCategories]);

    const getInstrumentCategories = () => {
        const options: SelectInputOption<string>[] = [];
        forEach(instrumentCategories, (l) => {
            options.push({ displayText: l.label!, value: l.id! });
        });
        return options;
    };

    // function getNameForUse(cname: string | keyof ApplicationAndInstrumentStep): string { return getName2(cname, isSummary); }

    // TO DO - move this and Radio + CheckboxGroup into a new component
    const [_field, _meta] = useField(getName('patternApprovalType'));
    // console.log('Selected application type: ', _field.value);

    const [_newField, _newMeta] = useField(getName('newSubOptions'));
    // console.log('Selected application new options: ', _newField.value);

    const [_varField, _varMeta] = useField(getName('varSubOptions'));
    // console.log('Selected application var options: ', _varField.value);

    const [_othField, _othMeta] = useField(getName('othSubOptions'));
    // console.log('Selected application oth options: ', _othField.value);

    const onInstrumentCategoryChange = async (event: ChangeEvent<HTMLInputElement>) => {
        setIsInstrumentTypeDisabled(false);
        context.setFieldValue('instrumentType', '');
        context.setFieldTouched('instrumentType', false);
        if (event.target.value !== null && instrumentTypes !== undefined) {
            await setInstrumentTypesSelected(getInstrumentTypes(instrumentTypes, event.target.value));
            if (event.target.value === noInstrumentCategoriestId.current) {
                context.setFieldValue('instrumentType', noInstrumentTypeId.current);
                setIsInstrumentTypeDisabled(true);
            }
        }
    };
    const instrumentCategoryId = _instrumentCatField.value as string | undefined;
    const instrumentTypeId = _instrumentTypeField.value as string | undefined;

    // return !instrumentCategories || !instrumentTypesSelected ? (
    //     <BlockUISpinner>
    //         <p>Loading...</p>
    //     </BlockUISpinner>
    // ) :

    const renderApplTypeSelector = () => {
        const renderApplTypeSummary = () => {
            // Helper to get labels for suboption arrays
            const getSubOptionLabels = (value: string[] | string | undefined, options: { label: string; value: string }[]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return 'Not selected';
                if (Array.isArray(value)) {
                    return value
                        .map((v) => options.find((o) => o.value === v)?.label)
                        .filter(Boolean)
                        .join(', ') || 'Not selected';
                }
                return options.find((o) => o.value === value)?.label || 'Not selected';
            };
            return (
                <Container>
                    <Row className='mb-0'>
                        <SummaryDisplay
                            label='Application type'
                            id='applicationType'
                            as='p'
                            value={_field.value ? applicationTypes.find((a) => a.value === _field.value)?.label || 'Not selected' : 'Not selected'}
                        />
                        {/* Only show sub options for the selected application type */}
                        {_field.value === PatternApprovalRequiredValues.NewCertificate && (
                            <SummaryDisplay
                                label='Applying for'
                                id='newCertificateSubOptions'
                                as='ul'
                                className='mb-0'
                                value={getSubOptionLabels(_newField.value, newCertificateSubOptions)}
                            />
                        )}
                        {_field.value === PatternApprovalRequiredValues.Variation && (
                            <SummaryDisplay
                                label='Applying for'
                                id='variationSubOptions'
                                as='ul'
                                className='mb-0'
                                value={getSubOptionLabels(_varField.value, variationSubOptions)}
                            />
                        )}
                        {_field.value === PatternApprovalRequiredValues.OtherApproval && (
                            <SummaryDisplay
                                label='Applying for'
                                id='otherApprovalSubOptions'
                                as='ul'
                                className='mb-0'
                                value={getSubOptionLabels(_othField.value, otherApprovalSubOptions)}
                            />
                        )}
                    </Row>
                </Container>
            );
        };

        if (isSummary) {
            return renderApplTypeSummary();
        }
        if (isDataLoading) {
            return (
                <Container>
                    <Row>
                        <BlockUISpinner partial>
                            <p>Loading data...</p>
                        </BlockUISpinner>
                    </Row>
                </Container>
            );
        }
        return (
            <Container>
                <Row className='mb-5'>
                    <fieldset
                        id='appl-selector'
                        role='group'
                        tabIndex={-1}
                    >
                        <legend className='h4'>
                            What type of application do you need?
                        </legend>
                        {applicationTypes.map((applicationType) => (
                            <Card
                                key={applicationType.key}
                                className={`mb-1 border border-3 border-white ${selectedApplication === applicationType.value ? 'selected-application' : ''}`}
                            >
                                <Card.Body className='d-flex flex-column align-items-start p-0'>
                                    <div className='form-field-container mb-0 w-100' tabIndex={-1}>
                                        <RadioButton
                                            id={`radio-${applicationType.id}`}
                                            name={getName('patternApprovalType')}
                                            label={applicationType.label}
                                            checked={selectedApplication === applicationType.value}
                                            onChange={(_e: React.ChangeEvent<HTMLInputElement>) => {
                                                setSelectedApplication(applicationType.value);
                                                if (context.submitCount > 0) {
                                                    context.resetForm({
                                                        // values: {}, // Optionally reset values to initial or empty
                                                        errors: {},
                                                        touched: {},
                                                    });
                                                }
                                            }}
                                            className='form-field me-2 p-0'
                                            value={applicationType.value}
                                        />
                                    </div>

                                    {/* Child checkbox UI */}
                                    {applicationType.value === PatternApprovalRequiredValues.NewCertificate && (
                                        <HidableField name={getName('isApplNewHide')}>
                                            <div
                                                id={`${applicationType.key}-sub-options-group`}
                                                className='mb-0 ms-3 px-4 collapse fade show'
                                            >
                                                <div>
                                                    <CheckboxGroup
                                                        legend='Select all that apply'
                                                        name={getName(`${applicationType.key}SubOptions`)}
                                                        id={`q-${applicationType.key}-sub-options`}
                                                        containerClassName='mb-2'
                                                        legendClassName='visually-hidden'
                                                        className='checkbox-sm'
                                                        isSummary={isSummary}
                                                        supressFieldLevelMessages
                                                        options={newCertificateSubOptions}
                                                    />
                                                </div>
                                            </div>
                                        </HidableField>
                                    )}

                                    {applicationType.value === PatternApprovalRequiredValues.Variation && (
                                        <HidableField name={getName('isApplVariationHide')}>
                                            <div
                                                id={`${applicationType.key}-sub-options-group`}
                                                className='mb-0 ms-3 px-4 collapse fade show'
                                            >
                                                <div>
                                                    <CheckboxGroup
                                                        legend='Select all that apply'
                                                        name={getName(`${applicationType.key}SubOptions`)}
                                                        id={`q-${applicationType.key}-sub-options`}
                                                        containerClassName='mb-2'
                                                        legendClassName='visually-hidden'
                                                        className='checkbox-sm'
                                                        isSummary={isSummary}
                                                        supressFieldLevelMessages
                                                        options={variationSubOptions}
                                                    />
                                                </div>
                                            </div>
                                        </HidableField>
                                    )}

                                    {applicationType.value === PatternApprovalRequiredValues.OtherApproval && (
                                        <HidableField name={getName('isApplOtherHide')}>
                                            <div
                                                id={`${applicationType.key}-sub-options-group`}
                                                className='mb-0 ms-3 px-4 collapse fade show'
                                            >
                                                <div>
                                                    <CheckboxGroup
                                                        legend='Select all that apply'
                                                        name={getName(`${applicationType.key}SubOptions`)}
                                                        id={`q-${applicationType.key}-sub-options`}
                                                        containerClassName='mb-2'
                                                        legendClassName='visually-hidden'
                                                        className='checkbox-sm'
                                                        isSummary={isSummary}
                                                        supressFieldLevelMessages
                                                        options={otherApprovalSubOptions}
                                                    />
                                                </div>
                                            </div>
                                        </HidableField>
                                    )}

                                </Card.Body>
                            </Card>
                        ))}
                    </fieldset>
                </Row>
            </Container>
        );
    };

    const renderInstrumentInfoPanel = () => (
        <InstrumentInfoPanel
            name='InstrumentInfo'
            selectedInstrumentCategoryId={instrumentCategoryId}
            selectedInstrumentTypeId={instrumentTypeId}
            isNewCustomer={false}
        />
    );

    const renderWarningPanel = () => (
        <Alert variant='warning' className='d-flex' role='alert' aria-live='assertive'>
            <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                <div className='bgCircle me-3'>
                    <i className='icon-warning' aria-hidden='true' />
                </div>
            </div>
            <div>
                <p className='mb-3'>
                    <strong>
                        {'Warning: '}
                    </strong>
                    OIML certificates apply only to specific instrument types:
                </p>
                <ul>
                    <li>Continuous totalising automatic weighing instruments</li>
                    <li>Non-automatic weighing instruments</li>
                </ul>
                <p className='mb-0'>
                    You may keep this option selected, but the pattern approval examiner could remove it during assessment.
                </p>
            </div>
        </Alert>
    );

    return (
        <>
            <Row>
                {renderApplTypeSelector()}
            </Row>
            {/* NEW application content panel based on above Radio/Checkbox selections  */}
            <HidableField name={getName('isApplNewHide')}>
                <Row className={isSummary ? '' : 'mb-2'}>
                    <h2 className={isSummary ? 'h5 my-3' : 'h4'}>Instrument details</h2>
                    <SelectInput<string>
                        name={getName('instrumentCategory')}
                        label='Select the category of your instrument'
                        options={getInstrumentCategories()}
                        onChange={(event) => {
                            onInstrumentCategoryChange(event as React.ChangeEvent<HTMLInputElement>);
                        }}
                        isSummary={isSummary}
                        addBlank
                    />
                    <SelectInput<string>
                        name={getName('instrumentType')}
                        label='Select the type of your instrument'
                        options={instrumentTypesSelected ?? []}
                        isSummary={isSummary}
                        readOnly={isInstrumentTypeDisabled}
                        addBlank
                    />
                </Row>
                {/*  TO DO - Info panel conditions */}
                {!isSummary && (
                    <Row className={isSummary ? '' : 'mb-2'}>
                        <Col md={12}>
                            {renderInstrumentInfoPanel()}
                        </Col>
                        <Col md={12}>
                            <HidableField name={getName('isApplOIMLHide')}>
                                {renderWarningPanel()}
                            </HidableField>
                        </Col>
                    </Row>
                )}
                {/* TBC Conditional display only after 2nd drop down is selected/changed */}
                <HidableField name={getName('isApplNewInstrumentHide')}>
                    <Row className={isSummary ? '' : 'mb-4'}>
                        <TextInput
                            label='Instrument make (optional)'
                            name={getName('make')}
                            // inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
                            isSummary={isSummary}
                        />
                        <TextInput
                            label='Model (optional)'
                            name={getName('model')}
                            // inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
                            isSummary={isSummary}
                        />
                        <TextAreaInput
                            label='Summary of application'
                            name={getName('summary')}
                            inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
                            rows={3}
                            maxCharacters={500}
                            isSummary={isSummary}
                        />
                    </Row>
                </HidableField>
            </HidableField>
            {/* TO DO Variation content panel based on above Radio/Checkbox selections  */}
            <HidableField name={getName('isApplVariationHide')}>
                <Row className={isSummary ? '' : 'mb-4'}>
                    <h2 className={isSummary ? 'h5 my-3' : 'visually-hidden'}>Variation details</h2>
                    <CertificateNumberLookup
                        name={getName('certificateNumber')}
                        idName={getName('certificateNumberId')}
                        label='Certificate number'
                        // placeholder='Enter the certificate number'
                        inlineHelp='For example: 5/6A/91B'
                        optionsFieldName='lookupName'
                        parentName='id'
                        isSummary={isSummary}
                    />
                    <TextAreaInput
                        label='Summary of application'
                        name={getName('summary')}
                        inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
                        rows={3}
                        maxCharacters={500}
                        isSummary={isSummary}
                    />
                </Row>
            </HidableField>
            {/* TO DO Other content panel based on above Radio/Checkbox selections  */}
            <HidableField name={getName('isApplOtherHide')}>
                <Row className={isSummary ? '' : 'mb-4'}>
                    <h2 className={isSummary ? 'h5 my-3' : 'visually-hidden'}>Other options detail</h2>
                    <CertificateNumberLookup
                        name={getName('certificateNumber')}
                        idName={getName('certificateNumberId')}
                        label='Certificate number (optional)'
                        // placeholder='Enter the certificate number'
                        inlineHelp='For example: 5/6A/91B'
                        optionsFieldName='lookupName'
                        isSummary={isSummary}
                    />
                    <TextAreaInput
                        label='Summary of application'
                        name={getName('summary')}
                        inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
                        rows={3}
                        maxCharacters={500}
                        isSummary={isSummary}
                    />
                </Row>
            </HidableField>
        </>
    );
};

export default ApplicationAndInstrument;
