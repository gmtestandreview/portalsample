import { useFormikContext } from 'formik';
import { FormProvider } from 'react-hook-form';
import type { AddressDetailsDto } from '../../api/web-api-client';
import { useFormikRhfBridge } from '../../components/forms/useFormikRhfBridge';
import { RhfHiddenRulesProvider } from '../../components/forms/RhfHidableField';
import {
  deliveryAndReturnSaveValidation,
  deliveryAndReturnSubmitValidation,
} from './validation';
import {
  addressTouchPaths,
  CONTACT_TOUCH_PATHS,
  createBridgedNamePredicate,
  NO_HIDDEN_RULES,
} from './formikBridgeHelpers';
import DeliveryAndReturnFormFields, {
  type DeliveryAndReturnFormValues,
} from './deliveryAndReturnFormFields';

// Leaf paths of the fields whose schema rules carry messages.
const touchPaths = [
  'returnOrganisationName',
  'packagingNotes',
  'carrierName',
  'carrierAccountNumber',
  'carrierContactPerson',
  'carrierContactPhone',
  'insuranceNotes',
  'specialInstructions',
  ...CONTACT_TOUCH_PATHS,
  ...addressTouchPaths('returnAddress'),
] as const;

const isBridgedFieldName = createBridgedNamePredicate({
  names: [
    'returnContactType',
    'returnOrganisationName',
    'returnAddressType',
    'returnAddress',
    'returnMethod',
    'packagingNotes',
    'carrierName',
    'carrierAccountNumber',
    'carrierContactPerson',
    'carrierContactPhone',
    'shipmentMode',
    'shipmentPriority',
    'insuranceNotes',
    'customsValue',
    'specialInstructions',
  ],
  // The contact and the address are edited per field or (address) as a whole,
  // so any path beneath them is mirrored along with the top-level fields.
  prefixes: ['contact.', 'returnAddress.'],
});

interface DeliveryAndReturnFormikBridgeProps {
  streetAddress?: AddressDetailsDto | undefined;
  postalAddress?: AddressDetailsDto | undefined;
}

/**
 * Transitional boundary for the migrated delivery-and-return wizard step; see
 * `useFormikRhfBridge` for how the RHF fields stay in sync with Formik. The
 * hide rules live in Formik's `status.hidden`, so they are handed to the RHF
 * fields through the hidden-rules context.
 */
const DeliveryAndReturnFormikBridge = ({
  streetAddress,
  postalAddress,
}: Readonly<DeliveryAndReturnFormikBridgeProps>) => {
  const { status } = useFormikContext<DeliveryAndReturnFormValues>();
  const methods = useFormikRhfBridge<DeliveryAndReturnFormValues>({
    softSchema: deliveryAndReturnSaveValidation,
    hardSchema: deliveryAndReturnSubmitValidation,
    touchPaths,
    isBridgedName: isBridgedFieldName,
  });

  return (
    <FormProvider {...methods}>
      <RhfHiddenRulesProvider rules={status?.hidden ?? NO_HIDDEN_RULES}>
        <DeliveryAndReturnFormFields
          streetAddress={streetAddress}
          postalAddress={postalAddress}
        />
      </RhfHiddenRulesProvider>
    </FormProvider>
  );
};

export default DeliveryAndReturnFormikBridge;
