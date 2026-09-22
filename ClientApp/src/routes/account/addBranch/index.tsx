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
import { useModalDispatch } from "../../../components/modals/ModalContext.tsx";
import useBodyClass from "../../../components/Utilities/useBodyClass.tsx";
import useHtmlTitle from "../../../components/Utilities/useHtmlTitle.tsx";
import OrganisationDetails from "../organisationDetails.tsx";
import addBranchProps from "./addBranchProps.ts";

const addBranchWizardProps: WizardFormProps = {
	locationOnCompletion: "/",
	lastStepNextButtonTitle: "Save and close",
	// nextButtonTitle: 'Save and next',
	canSaveDraft: false,
	confirmationOnSubmission: {
		modalTitle: "Add branch or location confirmation",
		modalBodyText: "Are you sure you want to add this branch/location?",
		yesButtonTitle: "Yes, submit",
		noButtonTitle: "No, cancel",
	},
};

const statuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];

const AddBranch = () => {
	const { accounts, instance } = useMsal();
	const accountState = useAccountState();
	const accountDispatch = useAccountDispatch();
	const modalDispatch = useModalDispatch();
	const account: AccountContextState | null =
		accountState && accountDispatch
			? { ...accountState, ...accountDispatch }
			: null;
	const onShowBranchSelector = () => modalDispatch?.setShowBranchSelector(true);
	useHtmlTitle("Add branch or location | NMI Services portal");
	useBodyClass("wizard");
	return (
		<WizardForm {...addBranchWizardProps}>
			<WizardStep
				{...addBranchProps(
					accounts,
					instance,
					statuses,
					account,
					onShowBranchSelector,
				)}
			>
				<OrganisationDetails />
			</WizardStep>
		</WizardForm>
	);
};

export default AddBranch;
