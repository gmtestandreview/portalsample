import { useFormikContext } from 'formik';
import type { AddressDetailsDto } from '../../api/web-api-client';
import { FormProvider } from 'react-hook-form';
import { useFormikRhfBridge } from '../../components/forms/useFormikRhfBridge';
import { RhfHiddenRulesProvider } from '../../components/forms/RhfHidableField';
import {
  reportRecipientSaveValidation,
  reportRecipientSubmitValidation,
} from './validation';
import {
  addressTouchPaths,
  createBridgedNamePredicate,
  NO_HIDDEN_RULES,
} from './formikBridgeHelpers';
import ReportRecipientFormFields, {
  type ReportRecipientFormValues,
} from './reportRecipientFormFields';

const touchPaths = [
  'organisationName',
  'reportAddressType',
  ...addressTouchPaths('businessStreetAddress'),
] as const;

// The address is edited as a whole (selection) or per field (manual entry), so
// any path beneath it is mirrored along with the two top-level fields.
const isBridgedFieldName = createBridgedNamePredicate({
  names: ['organisationName', 'reportAddressType', 'businessStreetAddress'],
  prefixes: ['businessStreetAddress.'],
});

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
