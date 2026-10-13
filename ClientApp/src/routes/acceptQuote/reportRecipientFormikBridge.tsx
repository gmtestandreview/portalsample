import { useFormikContext } from 'formik';
import type { AddressDetailsDto } from '../../api/web-api-client';
import { FormProvider } from 'react-hook-form';
import { useFormikRhfBridge } from '../../components/forms/useFormikRhfBridge';
import { RhfHiddenRulesProvider } from '../../components/forms/RhfHidableField';
import type { Hideable } from '../../components/forms/types';
import {
  reportRecipientSaveValidation,
  reportRecipientSubmitValidation,
} from './validation';
import ReportRecipientFormFields, {
  type ReportRecipientFormValues,
} from './reportRecipientFormFields';

const touchPaths = [
  'organisationName',
  'reportAddressType',
  'businessStreetAddress.line1',
  'businessStreetAddress.line2',
  'businessStreetAddress.line3',
  'businessStreetAddress.suburb',
  'businessStreetAddress.postcode',
  'businessStreetAddress.state',
  'businessStreetAddress.searchText',
] as const;

// The address is edited as a whole (selection) or per field (manual entry), so
// any path beneath it is mirrored along with the two top-level fields.
const isBridgedFieldName = (name: string) =>
  name === 'organisationName' ||
  name === 'reportAddressType' ||
  name === 'businessStreetAddress' ||
  name.startsWith('businessStreetAddress.');

const NO_HIDDEN_RULES: Hideable = {};

interface ReportRecipientFormikBridgeProps {
  streetAddress?: AddressDetailsDto | undefined;
  postalAddress?: AddressDetailsDto | undefined;
}

/**
 * Transitional boundary for the migrated report-recipient wizard step; see
 * `useFormikRhfBridge` for how the RHF fields stay in sync with Formik. The
 * hide rules live in Formik's `status.hidden`, so they are handed to the RHF
 * fields through the hidden-rules context.
 */
const ReportRecipientFormikBridge = ({
  streetAddress,
  postalAddress,
}: Readonly<ReportRecipientFormikBridgeProps>) => {
  const { status } = useFormikContext<ReportRecipientFormValues>();
  const methods = useFormikRhfBridge<ReportRecipientFormValues>({
    softSchema: reportRecipientSaveValidation,
    hardSchema: reportRecipientSubmitValidation,
    touchPaths,
    isBridgedName: isBridgedFieldName,
  });

  return (
    <FormProvider {...methods}>
      <RhfHiddenRulesProvider rules={status?.hidden ?? NO_HIDDEN_RULES}>
        <ReportRecipientFormFields
          streetAddress={streetAddress}
          postalAddress={postalAddress}
        />
      </RhfHiddenRulesProvider>
    </FormProvider>
  );
};

export default ReportRecipientFormikBridge;
