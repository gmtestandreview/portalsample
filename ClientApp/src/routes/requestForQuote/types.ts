export interface RequestForQuoteStepProps {
    id?: string;
    name?: string;
    isSummary?: boolean;
    [key: string]: unknown;
}

export type InstrumentAndRequestProps = RequestForQuoteStepProps;
export type OrganisationAndContactProps = RequestForQuoteStepProps;

export interface SummaryProps {
    isSubmitted?: boolean;
    name?: string;
    [key: string]: unknown;
}
