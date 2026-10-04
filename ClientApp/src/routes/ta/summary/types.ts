import type { RequestForPatternApprovalAppDetails } from '../../../api/web-api-client';
import type { Hideable } from '../../../components/forms/types';
import { isHidden } from '../../../components/forms/utils';

/**
 * Props of the form-free TA summary sections. They read plain values, so they
 * render the same on any page and need no form library.
 */
export type TaSummaryValues = Pick<
  RequestForPatternApprovalAppDetails,
  'organisationAndContact' | 'applicationAndInstrument'
>;

export interface TaSummarySectionProps {
  values: TaSummaryValues;
  /** The page's hiding rules, keyed like the values (see `appDetailsProps`). */
  hidden: Hideable<Partial<TaSummaryValues>, Partial<TaSummaryValues>>;
}

/** Resolves a hide rule path such as `organisationAndContact.isManufacturerHide`. */
export const isSummaryFieldHidden = (
  { hidden, values }: Readonly<TaSummarySectionProps>,
  path: string
) => isHidden(path, hidden, values);
