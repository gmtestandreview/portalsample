import type { RequestForQuoteSummary } from '../../../api/web-api-client';
import type { Hideable } from '../../../components/forms/types';
import { isHidden } from '../../../components/forms/utils';

/**
 * Props of the form-free request-for-quote summary sections. They read plain
 * values, so they render the same on any page and need no form library.
 */
export type RfqSummaryValues = Pick<
  RequestForQuoteSummary,
  'organisationAndContact' | 'instrumentAndRequest'
>;

export interface RfqSummarySectionProps {
  values: RfqSummaryValues;
  /** The page's hiding rules, keyed like the values (see `requestForQuoteSummaryProps`). */
  hidden: Hideable<Partial<RfqSummaryValues>, Partial<RfqSummaryValues>>;
}

/** Resolves a hide rule path such as `organisationAndContact.principalContactHide`. */
export const isSummaryFieldHidden = (
  { hidden, values }: Readonly<RfqSummarySectionProps>,
  path: string
) => isHidden(path, hidden, values);
