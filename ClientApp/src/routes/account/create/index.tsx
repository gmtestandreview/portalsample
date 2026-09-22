import { useMsal } from "@azure/msal-react";
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
import AccountDetails from "../accountDetails.tsx";
import createAccountProps from "./createAccountProps.ts";

const createAccountWizardProps: WizardFormProps = {
	locationOnCompletion: "/success-creating-account",
	lastStepNextButtonTitle: "Create account",
	// nextButtonTitle: 'Save and next',
	canSaveDraft: false,
	confirmationOnSubmission: {
		modalTitle: "Create account confirmation",
		modalBodyText: "Are you sure you want to create this account?",
		yesButtonTitle: "Yes, submit",
		noButtonTitle: "No, cancel",
	},
};

const statuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];

const CreateAccount = () => {
	const { accounts, instance } = useMsal();
	const accountState = useAccountState();
	const accountDispatch = useAccountDispatch();
	const account: AccountContextState | null =
		accountState && accountDispatch
			? { ...accountState, ...accountDispatch }
			: null;
	useHtmlTitle("Create portal account | NMI Services portal");
	useBodyClass("wizard");
	return (
		<WizardForm {...createAccountWizardProps}>
			<WizardStep
				{...createAccountProps(accounts, instance, statuses, account)}
			>
				<AccountDetails />
			</WizardStep>
		</WizardForm>
	);
};

export default CreateAccount;
