import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Col } from "react-bootstrap";
import Row from "react-bootstrap/Row";
import type { RequestForQuoteDetails } from "../../api/web-api-client";
import { QuoteClient } from "../../api/web-api-client";
import { tokenRequest } from "../../authentication/authConfig";
import { useAccountState } from "../../authentication/hooks";
import BlockUISpinner from "../../components/BlockUISpinner";
import ViewPdfQuote from "../../components/Utilities/ViewPdfQuote";
import ViewPdfQuoteTerms from "../../components/Utilities/ViewPdfQuoteTerms";
import AppLogger from "../../instrumentation/AppLogger";
import NMIContactDetails from "../quotation/nMIContactDetails";
import QuoteDetails from "../quotation/quoteDetails";
import type { QuotationSummaryProps } from "./types";

const QuotationSummary = (props: QuotationSummaryProps) => {
	const { isSummary, cRMQuoteRequestId } = props;
	const { accounts, instance } = useMsal();
	const accountContext = useAccountState();
	const [isLoading, setIsLoading] = useState(false);
	const [quotationData, setQuotationData] = useState<
		RequestForQuoteDetails | undefined
	>();
	const [fileError, setFileError] = useState(false);

	useEffect(() => {
		const getQuoteDetails = async () => {
			try {
				AppLogger.verbose("QuotationSummary.getQuoteDetails", {
					CrmQuoteRequestId: cRMQuoteRequestId,
				});
				const client = new QuoteClient();
				const tokenResult = await instance.acquireTokenSilent({
					...tokenRequest,
					account: accounts[0],
				});
				client.setAuthToken(tokenResult.accessToken);
				const result = await client.getQuoteRequestDetails(cRMQuoteRequestId);
				setQuotationData(result);
			} catch (e) {
				setFileError(true);
				AppLogger.error(
					`Failed to get Quotedetails: ${cRMQuoteRequestId}`,
					e as Error,
				);
			}
		};

		const loadDataForDisplay = async () => {
			setIsLoading(true);
			await getQuoteDetails();
			setIsLoading(false);
		};
		loadDataForDisplay();
	}, [accounts, cRMQuoteRequestId, instance]);

	const renderQuotationSummary = () => (
		<>
			<QuoteDetails
				quotationData={quotationData}
				isSummary={isSummary}
				firstName={accountContext?.details?.givenName}
				lastName={accountContext?.details?.familyName}
				fileError={fileError}
			/>
			<Row className="mb-3">
				<Col md={12}>
					<div>
						<ViewPdfQuoteTerms
							quotationData={quotationData}
							setFileError={setFileError}
							setIsLoading={setIsLoading}
							prefixText="A minimum handling fee of AUD $250 will be charged for any
                            instrument that, on receipt, is found to be faulty [see  "
							suffixText="clause 11 (a)] and for any quotation accepted by the client
                            and subsequently cancelled before delivery of the instrument to NMI."
						/>
					</div>
					<div className="text-end">
						<ViewPdfQuote
							quotationData={quotationData}
							setFileError={setFileError}
							setIsLoading={setIsLoading}
							text="View detailed PDF quote"
						/>
					</div>
				</Col>
			</Row>
			<NMIContactDetails quotationData={quotationData} />
		</>
	);

	return (
		<>
			{isLoading && !isSummary && (
				<BlockUISpinner>
					<p>Loading...</p>
				</BlockUISpinner>
			)}
			{/* <Container> */}
			{renderQuotationSummary()}
			{/* </Container> */}
		</>
	);
};

export default QuotationSummary;
