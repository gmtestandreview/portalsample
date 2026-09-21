import { useMsal } from "@azure/msal-react";
import { Navigate, useParams } from "react-router";
import type { FormStepStatusDto } from "../../../api/web-api-client";
import { FormStepStatus } from "../../../api/web-api-client";
import type { AccountContextState } from "../../../authentication/accountContext";
import {
	useAccountDispatch,
	useAccountState,
} from "../../../authentication/hooks";
import WizardForm from "../../../components/forms/WizardForm";
import type { WizardFormProps } from "../../../components/forms/WizardForm/types";
import WizardStep from "../../../components/forms/WizardForm/WizardStep";
import useBodyClass from "../../../components/Utilities/useBodyClass";
import useHtmlTitle from "../../../components/Utilities/useHtmlTitle";
import { getValidPositiveIntegerId } from "../../common/routeParams";
import OrganisationDetails from "../organisationDetails";
import updateAccountProps from "./updateAccountProps";

const updateAccountWizardProps: WizardFormProps = {
	locationOnCompletion: "/",
	lastStepNextButtonTitle: "Save and close",
	// nextButtonTitle: 'Save and next',
	canSaveDraft: false,
	confirmationOnSubmission: {
		modalTitle: "Update organisation confirmation",
		modalBodyText: "Are you sure you want to update this organisation?",
		yesButtonTitle: "Yes, submit",
		noButtonTitle: "No, cancel",
	},
};

const statuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];

const UpdateAccount = () => {
	const { accounts, instance } = useMsal();
	const { id } = useParams();
	const accountState = useAccountState();
	const accountDispatch = useAccountDispatch();
	const account: AccountContextState | null =
		accountState && accountDispatch
			? { ...accountState, ...accountDispatch }
			: null;

	const accountId = getValidPositiveIntegerId(id);
	useHtmlTitle("Manage organisation | NMI Services portal");
	useBodyClass("wizard");

	if (accountId === null) {
		return <Navigate to="/not-found" replace />;
	}

	return (
		<WizardForm {...updateAccountWizardProps}>
			<WizardStep
				{...updateAccountProps(
					accounts,
					instance,
					statuses,
					account,
					accountId,
				)}
			>
				<OrganisationDetails />
			</WizardStep>
		</WizardForm>
	);
};

export default UpdateAccount;
