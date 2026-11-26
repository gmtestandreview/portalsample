import { orIfEmpty } from '../../utils/orIfEmpty';
import { useFormContext, useWatch } from 'react-hook-form';
import Row from 'react-bootstrap/Row';
import { useMemo } from 'react';
import { Alert, Card, Col, Container } from 'react-bootstrap';
import RhfHidableField from '../../components/forms/RhfHidableField';
import RhfSelectInput from '../../components/Inputs/RhfSelectInput';
import RhfTextAreaInput from '../../components/Inputs/RhfTextAreaInput';
import type { TAApplicationAndInstrumentProps } from './types';
import {
  type LookupResponse,
  type ApplicationAndInstrumentStepDto,
  PatternApprovalRequiredValues,
  type PatternApprovalRequiredValueOptions,
} from '../../api/web-api-client';
import {
  applicationTypes,
  newCertificateSubOptions,
  otherApprovalSubOptions,
  variationSubOptions,
} from './applicationOptions';
import type { SelectInputOption } from '../../components/Inputs/SelectInput/types';
import RhfCheckboxGroup from '../../components/Inputs/RhfCheckboxGroup';
import AppLogger from '../../instrumentation/AppLogger';
import RhfCertificateNumberLookup from '../../components/Inputs/RhfCertificateNumberLookup';
import RhfRadioButton from '../../components/Inputs/RhfRadioButton';
import InstrumentInfoPanel from './instrumentInfoPanel';
import RhfTextInput from '../../components/Inputs/RhfTextInput';
import { sortList } from '../common/helperFunctions';
import SummaryDisplay from '../../components/SummaryDisplay';

const getSubOptionLabels = (
  value: string[] | string | undefined,
  options: { label: string; value: string }[],
) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return 'Not selected';
  }
  if (Array.isArray(value)) {
    return (
      value
        .map(
          (optionValue) =>
            options.find((option) => option.value === optionValue)?.label,
        )
        .filter(Boolean)
        .join(', ') || 'Not selected'
    );
  }
  return orIfEmpty(
    options.find((option) => option.value === value)?.label,
    'Not selected',
  );
};

interface ApplicationTypeSelectorProps {
  isSummary: boolean | undefined;
  getName: (localName: string) => string;
  selectedApplication: string | null;
  applicationType: PatternApprovalRequiredValues | undefined;
  selectedNewSubOptions: PatternApprovalRequiredValueOptions[] | undefined;
  selectedVariationSubOptions:
    | PatternApprovalRequiredValueOptions[]
    | undefined;
  selectedOtherSubOptions: PatternApprovalRequiredValueOptions[] | undefined;
  onApplicationTypeChange: () => void;
}

const ApplicationTypeSelector = ({
  isSummary,
  getName,
  selectedApplication,
  applicationType,
  selectedNewSubOptions,
  selectedVariationSubOptions,
  selectedOtherSubOptions,
  onApplicationTypeChange,
}: ApplicationTypeSelectorProps) => {
  if (isSummary) {
    return (
      <Container>
        <Row className='mb-0'>
          <SummaryDisplay
            label='Application type'
            id='applicationType'
            as='p'
            value={
              applicationType
                ? orIfEmpty(
                    applicationTypes.find(
                      (application) => application.value === applicationType,
                    )?.label,
                    'Not selected',
                  )
                : 'Not selected'
            }
          />
          {applicationType === PatternApprovalRequiredValues.NewCertificate && (
            <SummaryDisplay
              label='Applying for'
              id='newCertificateSubOptions'
              as='ul'
              className='mb-0'
              value={getSubOptionLabels(
                selectedNewSubOptions,
                newCertificateSubOptions,
              )}
            />
          )}
          {applicationType === PatternApprovalRequiredValues.Variation && (
            <SummaryDisplay
              label='Applying for'
              id='variationSubOptions'
              as='ul'
              className='mb-0'
              value={getSubOptionLabels(
                selectedVariationSubOptions,
                variationSubOptions,
              )}
            />
          )}
          {applicationType === PatternApprovalRequiredValues.OtherApproval && (
            <SummaryDisplay
              label='Applying for'
              id='otherApprovalSubOptions'
              as='ul'
              className='mb-0'
              value={getSubOptionLabels(
                selectedOtherSubOptions,
                otherApprovalSubOptions,
              )}
            />
          )}
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row className='mb-5'>
        <fieldset id='appl-selector' role='group' tabIndex={-1}>
          <legend className='h4'>What type of application do you need?</legend>
          {applicationTypes.map((application) => (
            <Card
              key={application.key}
              className={`mb-1 border border-3 border-white ${selectedApplication === application.value ? 'selected-application' : ''}`}
            >
              <Card.Body className='d-flex flex-column align-items-start p-0'>
                <div className='form-field-container mb-0 w-100' tabIndex={-1}>
                  <RhfRadioButton
                    id={`radio-${application.id}`}
                    name={getName('patternApprovalType')}
                    label={application.label}
                    onChange={onApplicationTypeChange}
                    value={application.value}
                  />
                </div>
                {application.value ===
                  PatternApprovalRequiredValues.NewCertificate && (
                  <RhfHidableField name={getName('isApplNewHide')}>
                    <div
                      id={`${application.key}-sub-options-group`}
                      className='mb-0 ms-3 px-4 collapse fade show'
                    >
                      <div>
                        <RhfCheckboxGroup
                          legend='Select all that apply'
                          name={getName(`${application.key}SubOptions`)}
                          id={`q-${application.key}-sub-options`}
                          containerClassName='mb-2'
                          legendClassName='visually-hidden'
                          className='checkbox-sm'
                          isSummary={isSummary}
                          supressFieldLevelMessages
                          options={newCertificateSubOptions}
                        />
                      </div>
                    </div>
                  </RhfHidableField>
                )}
                {application.value ===
                  PatternApprovalRequiredValues.Variation && (
                  <RhfHidableField name={getName('isApplVariationHide')}>
                    <div
                      id={`${application.key}-sub-options-group`}
                      className='mb-0 ms-3 px-4 collapse fade show'
                    >
                      <div>
                        <RhfCheckboxGroup
                          legend='Select all that apply'
                          name={getName(`${application.key}SubOptions`)}
                          id={`q-${application.key}-sub-options`}
                          containerClassName='mb-2'
                          legendClassName='visually-hidden'
                          className='checkbox-sm'
                          isSummary={isSummary}
                          supressFieldLevelMessages
                          options={variationSubOptions}
                        />
                      </div>
                    </div>
                  </RhfHidableField>
                )}
                {application.value ===
                  PatternApprovalRequiredValues.OtherApproval && (
                  <RhfHidableField name={getName('isApplOtherHide')}>
                    <div
                      id={`${application.key}-sub-options-group`}
                      className='mb-0 ms-3 px-4 collapse fade show'
                    >
                      <div>
                        <RhfCheckboxGroup
                          legend='Select all that apply'
                          name={getName(`${application.key}SubOptions`)}
                          id={`q-${application.key}-sub-options`}
                          containerClassName='mb-2'
                          legendClassName='visually-hidden'
                          className='checkbox-sm'
                          isSummary={isSummary}
                          supressFieldLevelMessages
                          options={otherApprovalSubOptions}
                        />
                      </div>
                    </div>
                  </RhfHidableField>
                )}
              </Card.Body>
            </Card>
          ))}
        </fieldset>
      </Row>
    </Container>
  );
};

const ApplicationAndInstrument = (
  props: Readonly<TAApplicationAndInstrumentProps>,
) => {
  const { isSummary, name } = props;
  const getName = (localName: string) =>
    name ? `${name}.${localName}` : localName;
  const {
    setValue,
    resetField,
    reset,
    formState: { submitCount },
  } = useFormContext<ApplicationAndInstrumentStepDto>();
  const patternApprovalType = useWatch({
    name: getName('patternApprovalType'),
  }) as PatternApprovalRequiredValues | undefined;
  // The saved step values default the application type to a new certificate
  // when they load, so the selected application is just the field value.
  const selectedApplication: string = orIfEmpty(
    patternApprovalType,
    PatternApprovalRequiredValues.NewCertificate,
  );

  // Lookup values are loaded in the parent component and live in the form
  // values, so we read them from there without making separate API calls here.
  // We just need to transform them into the format needed for the dropdowns.
  const instrumentType = useWatch({ name: getName('instrumentType') }) as
    | string
    | undefined;
  const instrumentCategory = useWatch({
    name: getName('instrumentCategory'),
  }) as string | undefined;
  const typeLookup = useWatch({ name: getName('instrumentTypeLookup') }) as
    | LookupResponse[]
    | undefined;
  const categoryLookup = useWatch({
    name: getName('instrumentCategoryLookup'),
  }) as LookupResponse[] | undefined;

  const getInstrumentTypes = (
    values: LookupResponse[],
    parentId: string | undefined,
  ) => {
    const options: SelectInputOption<string>[] = [];
    if (parentId !== undefined && parentId !== '') {
      for (const l of values) {
        if (l.parentId === parentId) {
          options.push({ displayText: l.label ?? '', value: l.id ?? '' });
        }
      }
    } else if (isSummary) {
      for (const l of values) {
        options.push({ displayText: l.label ?? '', value: l.id ?? '' });
      }
    }
    const [sorted, lastId] = sortList(options, 'No instrument', 'displayText');

    return { options: sorted, noInstrumentTypeId: lastId };
  };

  // The form starts with an empty step while the controller loads the saved
  // values. Keep the controls empty until both lookup responses arrive; the
  // categories, types and disabled flag then follow from the form fields, so
  // they are derived here instead of synced into state from an effect.
  const lookupsLoaded =
    categoryLookup !== undefined && typeLookup !== undefined;
  const sortedCategories = useMemo(() => {
    if (categoryLookup === undefined || typeLookup === undefined) {
      return undefined;
    }
    try {
      const [sorted, lastId] = sortList(
        categoryLookup,
        'No measurement',
        'label',
      );
      return {
        categories: sorted,
        noInstrumentCategoryId: lastId,
        types: typeLookup,
      };
    } catch (e) {
      AppLogger.error('Failed to retrieve look ups', e as Error);
      return undefined;
    }
  }, [categoryLookup, typeLookup]);
  const instrumentCategories = sortedCategories?.categories;
  const instrumentTypes = lookupsLoaded ? typeLookup : undefined;
  const typesAreListed = instrumentType !== undefined || isSummary === true;
  const instrumentTypesSelected =
    sortedCategories !== undefined && typesAreListed
      ? getInstrumentTypes(sortedCategories.types, instrumentCategory).options
      : [];
  const isInstrumentTypeDisabled =
    sortedCategories !== undefined &&
    typesAreListed &&
    !isSummary &&
    instrumentCategory === sortedCategories.noInstrumentCategoryId;

  const getInstrumentCategories = () => {
    const options: SelectInputOption<string>[] = [];
    for (const l of instrumentCategories ?? []) {
      // `sortList` read every `label` to order these categories, so a missing
      // label cannot reach this point.
      options.push({ displayText: String(l.label), value: l.id ?? '' });
    }
    return options;
  };

  const newSubOptions = useWatch({ name: getName('newSubOptions') }) as
    | PatternApprovalRequiredValueOptions[]
    | undefined;
  const varSubOptions = useWatch({ name: getName('varSubOptions') }) as
    | PatternApprovalRequiredValueOptions[]
    | undefined;
  const othSubOptions = useWatch({ name: getName('othSubOptions') }) as
    | PatternApprovalRequiredValueOptions[]
    | undefined;

  const onInstrumentCategoryChange = (categoryId: string) => {
    const typeName = getName('instrumentType');
    // Clears the value and untouches the field (setValue('') then resetField touched): untouch
    // the field but keep its saved baseline, dirty state and error, then clear
    // the value so it still reads as changed (the unsaved-changes prompt relies
    // on that). "No measurement" then applies the "no instrument" default.
    resetField(typeName as 'instrumentType', {
      keepDirty: true,
      keepError: true,
    });
    setValue(typeName as 'instrumentType', '', { shouldDirty: true });
    if (
      instrumentTypes !== undefined &&
      categoryId === sortedCategories?.noInstrumentCategoryId
    ) {
      const { noInstrumentTypeId } = getInstrumentTypes(
        instrumentTypes,
        categoryId,
      );
      setValue(typeName as 'instrumentType', noInstrumentTypeId, {
        shouldDirty: true,
      });
    }
  };
  const instrumentCategoryId = instrumentCategory;
  const instrumentTypeId = instrumentType;

  // The radio has already written the chosen type to the form when this runs.
  const onApplicationTypeChange = () => {
    if (submitCount > 0) {
      // A reset with empty errors and touched after a failed submit
      // also put every value back to its loaded one, not just the errors and
      // touched state, so this reset does the same.
      reset();
    }
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
    <Alert
      variant='warning'
      className='d-flex'
      role='alert'
      aria-live='assertive'
    >
      <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
        <div className='bgCircle me-3'>
          <i className='icon-warning' aria-hidden='true' />
        </div>
      </div>
      <div>
        <p className='mb-3'>
          <strong>{'Warning: '}</strong>
          OIML certificates apply only to specific instrument types:
        </p>
        <ul>
          <li>Continuous totalising automatic weighing instruments</li>
          <li>Non-automatic weighing instruments</li>
        </ul>
        <p className='mb-0'>
          You may keep this option selected, but the pattern approval examiner
          could remove it during assessment.
        </p>
      </div>
    </Alert>
  );

  return (
    <>
      <Row>
        <ApplicationTypeSelector
          isSummary={isSummary}
          getName={getName}
          selectedApplication={selectedApplication}
          applicationType={patternApprovalType}
          selectedNewSubOptions={newSubOptions}
          selectedVariationSubOptions={varSubOptions}
          selectedOtherSubOptions={othSubOptions}
          onApplicationTypeChange={onApplicationTypeChange}
        />
      </Row>
      {/* NEW application content panel based on above Radio/Checkbox selections  */}
      <RhfHidableField name={getName('isApplNewHide')}>
        <Row className={isSummary ? '' : 'mb-2'}>
          <h2 className={isSummary ? 'h5 my-3' : 'h4'}>Instrument details</h2>
          <RhfSelectInput
            name={getName('instrumentCategory')}
            label='Select the category of your instrument'
            options={getInstrumentCategories()}
            onChange={onInstrumentCategoryChange}
            isSummary={isSummary}
            addBlank
          />
          <RhfSelectInput
            name={getName('instrumentType')}
            label='Select the type of your instrument'
            options={instrumentTypesSelected}
            isSummary={isSummary}
            readOnly={isInstrumentTypeDisabled}
            addBlank
          />
        </Row>
        {/*  TO DO - Info panel conditions */}
        {!isSummary && (
          // Inside a !isSummary guard, so the summary arm of a ternary here is dead.
          <Row className='mb-2'>
            <Col md={12}>{renderInstrumentInfoPanel()}</Col>
            <Col md={12}>
              <RhfHidableField name={getName('isApplOIMLHide')}>
                {renderWarningPanel()}
              </RhfHidableField>
            </Col>
          </Row>
        )}
        {/* TBC Conditional display only after 2nd drop down is selected/changed */}
        <RhfHidableField name={getName('isApplNewInstrumentHide')}>
          <Row className={isSummary ? '' : 'mb-4'}>
            <RhfTextInput
              label='Instrument make (optional)'
              name={getName('make')}
              // inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
              isSummary={isSummary}
            />
            <RhfTextInput
              label='Model (optional)'
              name={getName('model')}
              // inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
              isSummary={isSummary}
            />
            <RhfTextAreaInput
              label='Summary of application'
              name={getName('summary')}
              inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
              rows={3}
              maxCharacters={500}
              isSummary={isSummary}
            />
          </Row>
        </RhfHidableField>
      </RhfHidableField>
      {/* TO DO Variation content panel based on above Radio/Checkbox selections  */}
      <RhfHidableField name={getName('isApplVariationHide')}>
        <Row className={isSummary ? '' : 'mb-4'}>
          <h2 className={isSummary ? 'h5 my-3' : 'visually-hidden'}>
            Variation details
          </h2>
          <RhfCertificateNumberLookup
            name={getName('certificateNumber')}
            idName={getName('certificateNumberId')}
            label='Certificate number'
            // placeholder='Enter the certificate number'
            inlineHelp='For example: 5/6A/91B'
            optionsFieldName='lookupName'
            parentName='id'
            isSummary={isSummary}
          />
          <RhfTextAreaInput
            label='Summary of application'
            name={getName('summary')}
            inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
            rows={3}
            maxCharacters={500}
            isSummary={isSummary}
          />
        </Row>
      </RhfHidableField>
      {/* TO DO Other content panel based on above Radio/Checkbox selections  */}
      <RhfHidableField name={getName('isApplOtherHide')}>
        <Row className={isSummary ? '' : 'mb-4'}>
          <h2 className={isSummary ? 'h5 my-3' : 'visually-hidden'}>
            Other options detail
          </h2>
          <RhfCertificateNumberLookup
            name={getName('certificateNumber')}
            idName={getName('certificateNumberId')}
            label='Certificate number (optional)'
            // placeholder='Enter the certificate number'
            inlineHelp='For example: 5/6A/91B'
            optionsFieldName='lookupName'
            isSummary={isSummary}
          />
          <RhfTextAreaInput
            label='Summary of application'
            name={getName('summary')}
            inlineHelp='To help NMI process your request, briefly describe why you are submitting this application'
            rows={3}
            maxCharacters={500}
            isSummary={isSummary}
          />
        </Row>
      </RhfHidableField>
    </>
  );
};

export default ApplicationAndInstrument;
