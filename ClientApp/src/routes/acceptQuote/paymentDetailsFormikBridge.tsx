import { FormProvider } from 'react-hook-form';
import { useFormikRhfBridge } from '../../components/forms/useFormikRhfBridge';
import {
  paymentDetailsSaveValidation,
  paymentDetailsSubmitValidation,
} from './validation';
import {
  CONTACT_TOUCH_PATHS,
  createBridgedNamePredicate,
} from './formikBridgeHelpers';
import PaymentDetailsFormFields, {
  type PaymentDetailsFormValues,
} from './paymentDetailsFormFields';

const touchPaths = [
  'purchaseOrderNo',
  'invoiceSentTo',
  ...CONTACT_TOUCH_PATHS,
] as const;

const isBridgedFieldName = createBridgedNamePredicate({
  names: ['purchaseOrderNo', 'invoiceSentTo'],
  prefixes: ['contact.'],
});

interface PaymentDetailsFormikBridgeProps {
  quotationId?: string | undefined;
}

/**
 * Transitional boundary for the migrated payment-details wizard step; see
 * `useFormikRhfBridge` for how the RHF fields stay in sync with Formik.
 */
const PaymentDetailsFormikBridge = ({
  quotationId,
}: Readonly<PaymentDetailsFormikBridgeProps>) => {
  const methods = useFormikRhfBridge<PaymentDetailsFormValues>({
    softSchema: paymentDetailsSaveValidation,
    hardSchema: paymentDetailsSubmitValidation,
    touchPaths,
    isBridgedName: isBridgedFieldName,
  });

  return (
    <FormProvider {...methods}>
      <PaymentDetailsFormFields quotationId={quotationId} />
    </FormProvider>
  );
};

export default PaymentDetailsFormikBridge;
