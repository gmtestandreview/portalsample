import { useMsal } from "@azure/msal-react";
import { useParams } from "react-router";
import type { FormStepStatusDto } from "../../../api/web-api-client.ts";
import { FormStepStatus } from "../../../api/web-api-client.ts";
import type { AccountContextState } from "../../../authentication/accountContext.tsx";
import {
	useAccountDispatch,
	useAccountState,
} from "../../../authentication/hooks.tsx";
import WizardForm from "../../../components/forms/WizardForm/index.tsx";
import type { WizardFormProps } from "../../../components/forms/WizardForm/types.ts";
import WizardStep from "../../../components/forms/WizardForm/WizardStep.tsx";
import useBodyClass from "../../../components/Utilities/useBodyClass.tsx";
import useHtmlTitle from "../../../components/Utilities/useHtmlTitle.tsx";
import ContactDetails from "../contactDetails.tsx";
import updateContactProps from "./updateContactProps.ts";

const updateContactWizardProps: WizardFormProps = {
	locationOnCompletion: "/",
	lastStepNextButtonTitle: "Save and close",
	canSaveDraft: false,
	confirmationOnSubmission: {
		modalTitle: "Update contact confirmation",
		modalBodyText: "Are you sure you want to update this contact?",
		yesButtonTitle: "Yes, submit",
		noButtonTitle: "No, cancel",
	},
};

const statuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];

const UpdateContact = () => {
	const { accounts, instance } = useMsal();
	const { id } = useParams();
	const accountState = useAccountState();
	const accountDispatch = useAccountDispatch();
	const account: AccountContextState | null =
		accountState && accountDispatch
			? { ...accountState, ...accountDispatch }
			: null;

	const contactId: number = Number(id ?? 0);
	useHtmlTitle("Update contact | NMI Services portal");
	useBodyClass("wizard");
	return (
		<WizardForm {...updateContactWizardProps}>
			<WizardStep
				{...updateContactProps(
					accounts,
					instance,
					statuses,
					account,
					contactId,
				)}
			>
				<ContactDetails />
			</WizardStep>
		</WizardForm>
	);
};

export default UpdateContact;
