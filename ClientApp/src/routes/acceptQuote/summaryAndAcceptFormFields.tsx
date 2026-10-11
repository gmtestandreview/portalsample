import RhfCheckbox from '../../components/Inputs/RhfCheckbox';
import RhfRadioButtonGroup from '../../components/Inputs/RhfRadioButtonGroup';
import RhfTextAreaInput from '../../components/Inputs/RhfTextAreaInput';
import RhfHidableField from '../../components/forms/RhfHidableField';
import type { SummaryAndAcceptStep } from '../../api/web-api-client';
import type { BridgedValues } from '../../components/forms/useFormikRhfBridge';

export type SummaryAndAcceptFormValues = SummaryAndAcceptStep & BridgedValues;

const MAX_DISPUTE_CHARACTERS = 300;
const DISPUTE_ROWS = 4;

const ASSOCIATED_DISPUTES_OPTIONS = [
  { label: 'Yes', value: 'Yes', id: 'associatedDisputes-Yes' },
  { label: 'No', value: 'No', id: 'associatedDisputes-No' },
];

/** The associated-dispute question and its conditional details. */
export const AssociatedDisputeFields = () => (
  <>
    <RhfRadioButtonGroup<string>
      legend='Any associated disputes?'
      name='associatedDisputes'
      id='q-associatedDisputes'
      inlineHelp={<>Are the services requested in connection with a dispute</>}
      options={ASSOCIATED_DISPUTES_OPTIONS}
    />
    <RhfHidableField name='associatedDispute'>
      <RhfTextAreaInput
        label='Please provide details of the associated dispute'
        name='associatedDispute'
        inlineHelp={
          <>
            NMI reserves the right to require a discussion between all parties
            to the dispute before providing the services.{' '}
            <span className='d-block pt-1'>
              Enter a maximum of 300 characters.
            </span>
          </>
        }
        rows={DISPUTE_ROWS}
        maxCharacters={MAX_DISPUTE_CHARACTERS}
      />
    </RhfHidableField>
  </>
);

/** The acceptance of the quotation. */
export const AcceptanceField = () => (
  <RhfCheckbox
    label='Yes, on behalf of my organisation, I accept the quotation'
    name='acceptanceOfQuote'
    containerClassName='mb-0 pe-1 w-auto'
  />
);
