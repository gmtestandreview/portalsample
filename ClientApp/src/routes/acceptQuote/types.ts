import type { SummaryAndAcceptStep } from '../../api/web-api-client';
import type { Hideable } from '../../components/forms/types';

export interface AcceptQuoteStepProps {
  id?: string | undefined;
  name?: string | undefined;
  isSummary?: boolean | undefined;
  cRMQuoteRequestId?: string | undefined;
  isSubmitted?: boolean;
  summaryValues?: SummaryAndAcceptStep;
  summaryHidden?: Hideable<
    Partial<SummaryAndAcceptStep>,
    Partial<SummaryAndAcceptStep>
  >;
  [key: string]: unknown;
}

export type DeliveryAndReturnProps = AcceptQuoteStepProps;
export type PaymentDetailsProps = AcceptQuoteStepProps;
export type QuotationSummaryProps = AcceptQuoteStepProps;
export type ReportRecipientProps = AcceptQuoteStepProps;
export type SummaryAndAcceptProps = AcceptQuoteStepProps;
