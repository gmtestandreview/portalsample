import SharedNMIContactDetails from '../common/NMIContactDetails';
import type { RequestForQuoteDetails } from '../../api/web-api-client';

const quotationHeading =
  'Contact your NMI test officer if any of the details are not correct before proceeding.';

const NMIContactDetails = (
  props: Readonly<{
    quotationData: RequestForQuoteDetails | undefined;
  }>,
) => (
  <SharedNMIContactDetails
    heading={quotationHeading}
    quotationData={props.quotationData}
  />
);

export default NMIContactDetails;
