import type { ReactNode } from 'react';
import { useFormikContext } from 'formik';
import { FormProvider } from 'react-hook-form';
import { useFormikRhfBridge } from '../../components/forms/useFormikRhfBridge';
import { RhfHiddenRulesProvider } from '../../components/forms/RhfHidableField';
import {
  summaryAndAcceptSaveValidation,
  summaryAndAcceptSubmitValidation,
} from './validation';
import {
  createBridgedNamePredicate,
  NO_HIDDEN_RULES,
} from './formikBridgeHelpers';
import type { SummaryAndAcceptFormValues } from './summaryAndAcceptFormFields';

// Leaf paths of the fields whose schema rules carry messages.
const touchPaths = ['associatedDispute', 'acceptanceOfQuote'] as const;

const isBridgedFieldName = createBridgedNamePredicate({
  names: ['associatedDisputes', 'associatedDispute', 'acceptanceOfQuote'],
});

interface SummaryAndAcceptFormikBridgeProps {
  children?: ReactNode;
}

/**
 * Transitional boundary for the migrated summary-and-accept wizard step; see
 * `useFormikRhfBridge` for how the RHF fields stay in sync with Formik. The
 * hide rules live in Formik's `status.hidden`, so they are handed to the RHF
 * fields through the hidden-rules context. The editable fields sit between
 * read-only content, so the bridge wraps that content as `children`.
 */
const SummaryAndAcceptFormikBridge = ({
  children,
}: Readonly<SummaryAndAcceptFormikBridgeProps>) => {
  const { status } = useFormikContext<SummaryAndAcceptFormValues>();
  const methods = useFormikRhfBridge<SummaryAndAcceptFormValues>({
    softSchema: summaryAndAcceptSaveValidation,
    hardSchema: summaryAndAcceptSubmitValidation,
    touchPaths,
    isBridgedName: isBridgedFieldName,
  });

  return (
    <FormProvider {...methods}>
      <RhfHiddenRulesProvider rules={status?.hidden ?? NO_HIDDEN_RULES}>
        {children}
      </RhfHiddenRulesProvider>
    </FormProvider>
  );
};

export default SummaryAndAcceptFormikBridge;
