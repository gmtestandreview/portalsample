import type { ReactNode } from 'react';
import { useFormikContext } from 'formik';
import { FormProvider } from 'react-hook-form';
import { useFormikRhfBridge } from '../../components/forms/useFormikRhfBridge';
import { RhfHiddenRulesProvider } from '../../components/forms/RhfHidableField';
import type { Hideable } from '../../components/forms/types';
import {
  summaryAndAcceptSaveValidation,
  summaryAndAcceptSubmitValidation,
} from './validation';
import type { SummaryAndAcceptFormValues } from './summaryAndAcceptFormFields';

// Leaf paths of the fields whose schema rules carry messages.
const touchPaths = ['associatedDispute', 'acceptanceOfQuote'] as const;

const bridgedFieldNames: ReadonlySet<string> = new Set([
  'associatedDisputes',
  'associatedDispute',
  'acceptanceOfQuote',
]);

const isBridgedFieldName = (name: string) => bridgedFieldNames.has(name);

const NO_HIDDEN_RULES: Hideable = {};

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
