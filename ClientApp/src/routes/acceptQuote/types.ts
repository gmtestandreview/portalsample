export interface AcceptQuoteStepProps {
    id?: string;
    name?: string;
    isSummary?: boolean;
    cRMQuoteRequestId?: string;
    isSubmitted?: boolean;
    [key: string]: unknown;
}

export type DeliveryAndReturnProps = AcceptQuoteStepProps;
export type PaymentDetailsProps = AcceptQuoteStepProps;
export type QuotationSummaryProps = AcceptQuoteStepProps;
export type ReportRecipientProps = AcceptQuoteStepProps;
export type SummaryAndAcceptProps = AcceptQuoteStepProps;
