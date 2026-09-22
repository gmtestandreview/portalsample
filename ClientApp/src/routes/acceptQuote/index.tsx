import { useMsal } from "@azure/msal-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { FormStepStatusDto } from "../../api/web-api-client.ts";
import { AcceptQuoteClient, QuoteClient } from "../../api/web-api-client.ts";
import type { AccountDetails } from "../../authentication/accountContext.tsx";
import { tokenRequest } from "../../authentication/authConfig.ts";
import { useAccountState } from "../../authentication/hooks.tsx";
import BlockUiSpinner from "../../components/BlockUISpinner/index.tsx";
import WizardForm from "../../components/forms/WizardForm/index.tsx";
import type { WizardFormProps } from "../../components/forms/WizardForm/types.ts";
import WizardStep from "../../components/forms/WizardForm/WizardStep.tsx";
import useBodyClass from "../../components/Utilities/useBodyClass.tsx";
import AppLogger from "../../instrumentation/AppLogger.ts";
import DeliveryAndReturn from "./deliveryAndReturn.tsx";
import deliveryAndReturnProps from "./deliveryAndReturnProps.ts";
import PaymentDetails from "./paymentDetails.tsx";
import paymentDetailsProps from "./paymentDetailsProps.ts";
import ReportRecipient from "./reportRecipient.tsx";
import reportRecipientProps from "./reportRecipientProps.ts";
import SummaryAndAccept from "./summaryAndAccept.tsx";
import summaryAndAcceptProps from "./summaryAndAcceptProps.ts";

const bannerTitle = "Testing and calibration service - Quotation";

const AcceptQuote = () => {
	const { accounts, instance } = useMsal();
	const { id } = useParams();
	const account = useAccountState();
	const navigate = useNavigate();

	useBodyClass("wizard");

	const acceptQuoteWizardProps: WizardFormProps = {
		locationOnCompletion: `/submitted-success/${id}`,
		lastStepNextButtonTitle: "Submit and accept",
		nextButtonTitle: "Save and next",
		previousButtonTitle: "Back",
		canSaveDraft: true,
		confirmationOnSubmission: {
			modalTitle: "Are you sure you want to accept this quote?",
			modalBodyText: `Once you have accepted this quote,
        you will not be able to make any further changes in the Portal.`,
			noButtonTitle: "No, go back",
			yesButtonTitle: "Yes, submit",
		},
	};

	const isLoading = useRef(false);
	const [statuses, setStatuses] = useState<FormStepStatusDto[]>();
	const [crmQuoteRequestId, setCrmQuoteRequestId] = useState<string>("");
	const [referenceId, setReferenceId] = useState<string>("");

	useEffect(() => {
		const loadApplicationSteps = async () => {
			if (!statuses && accounts.length > 0) {
				AppLogger.verbose("AcceptQuote.loadApplicationSteps", { Id: id });
				const client = new AcceptQuoteClient();
				const quoteClient = new QuoteClient();
				const tokenResult = await instance.acquireTokenSilent({
					...tokenRequest,
					account: accounts[0],
				});
				client.setAuthToken(tokenResult.accessToken);
				quoteClient.setAuthToken(tokenResult.accessToken);
				try {
					const result = await client.getStepStatuses(id!);
					const quoteData = await quoteClient.getQuoteRequestDetails(
						result[0].crmQuoteRequestId!,
					);
					setReferenceId(quoteData.quoteRequestIdNum!);
					setStatuses(result);
					setCrmQuoteRequestId(result[0].crmQuoteRequestId!);
				} catch (error) {
					AppLogger.error(
						"Failed to load quote request details",
						error as Error,
						{ Id: id },
					);
					navigate("/not-found");
				}
			}
		};
		if (!isLoading.current) {
			loadApplicationSteps();
		}
		return () => {
			isLoading.current = true;
		};
	}, [accounts, id, instance, navigate, statuses]);

	const accountDetails: AccountDetails = account!.details!;
	return statuses ? (
		<WizardForm {...acceptQuoteWizardProps}>
			<WizardStep
				{...reportRecipientProps(
					id!,
					referenceId,
					accounts,
					instance,
					accountDetails,
					statuses,
					bannerTitle,
				)}
			>
				<ReportRecipient name="" id={id} />
			</WizardStep>
			<WizardStep
				{...deliveryAndReturnProps(
					id!,
					accounts,
					instance,
					accountDetails,
					statuses,
					bannerTitle,
				)}
			>
				<DeliveryAndReturn name="" id={id} />
			</WizardStep>
			<WizardStep
				{...paymentDetailsProps(
					id!,
					accounts,
					instance,
					accountDetails,
					statuses,
					bannerTitle,
				)}
			>
				<PaymentDetails name="" id={id} />
			</WizardStep>
			<WizardStep
				{...summaryAndAcceptProps(
					id!,
					accounts,
					instance,
					accountDetails,
					statuses,
					bannerTitle,
				)}
			>
				<SummaryAndAccept name="" cRMQuoteRequestId={crmQuoteRequestId} />
			</WizardStep>
		</WizardForm>
	) : (
		<BlockUiSpinner>
			<p>Loading...</p>
		</BlockUiSpinner>
	);
};

export default AcceptQuote;
