import type { SummaryAndAcceptStep } from '../../../api/web-api-client';
import type { Hideable } from '../../../components/forms/types';
import { isHidden } from '../../../components/forms/utils';

/**
 * Props of the form-free accept-quote summary sections. They read plain
 * values, so they render the same under either form shell and need no form
 * library.
 */
export interface AcceptQuoteSummarySectionProps {
  values: SummaryAndAcceptStep;
  /** The page's hiding rules, keyed like the values (see `summaryAndAcceptProps`). */
  hidden: Hideable<
    Partial<SummaryAndAcceptStep>,
    Partial<SummaryAndAcceptStep>
  >;
}

/** Resolves a hide rule path such as `paymentDetails.rfqHide`. */
export const isSummaryFieldHidden = (
  { hidden, values }: Readonly<AcceptQuoteSummarySectionProps>,
  path: string,
) => isHidden(path, hidden, values);
