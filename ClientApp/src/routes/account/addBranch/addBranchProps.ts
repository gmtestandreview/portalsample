import type {
	AccountInfo,
	IPublicClientApplication,
} from "@azure/msal-browser";
import type { FormikHelpers } from "formik";
import type {
	AccountDto,
	FormStepStatusDto,
	GetAccountValuesDto,
	UserDto,
	ValidationProblemDetails,
} from "../../../api/web-api-client.ts";
import { AccountsClient, UsersClient } from "../../../api/web-api-client.ts";
import type { AccountContextState } from "../../../authentication/accountContext.tsx";
import { tokenRequest } from "../../../authentication/authConfig.ts";
import type { DiscardProps } from "../../../components/forms/FormikForm/types.ts";
import type {
	ErrorType,
	WizardFormStepValues,
	WizardStepProps,
} from "../../../components/forms/WizardForm/types.ts";
import { setBranchModalNotification } from "../../../storage/notification.ts";
import { NotificationSeverity } from "../../../storage/types.ts";
import { HttpStatusCode } from "../../../types.ts";
import branchSubmitValidation from "./validation.ts";

const loadAccountDetails =
	(accounts: AccountInfo[], instance: IPublicClientApplication) =>
	async (abortSignal?: AbortSignal) => {
		if (accounts.length > 0) {
			const client = new AccountsClient();
			const tokenResult = await instance.acquireTokenSilent({
				...tokenRequest,
				account: accounts[0],
			});
			client.setAuthToken(tokenResult.accessToken);

			const businessDetailsStep = await client.getBranchDetails(abortSignal);

			const wizardStepValues: WizardFormStepValues<GetAccountValuesDto> = {
				stepValues: { ...businessDetailsStep.stepValues },
			};
			return wizardStepValues;
		}

		throw new Error(
			"There was an error retrieving your organisation and contact details.",
		);
	};

const handleOrganisationUpdate = async (
	values: AccountDto,
	accountContext: AccountContextState | null,
	user: UserDto,
) => {
	if (
		values.name !== undefined &&
		values.isDefaultOrganisation === true &&
		accountContext
	) {
		accountContext.setOrganisationAndBranch(
			values.name,
			values.businessOrTradingName ?? "",
			values.branchOrLocationName ?? "",
		);
		accountContext.setDefaultOrganisationId(
			user.defaultOrganisationId,
			user.organisation?.crmGuid,
		);
	}
};

const handleBranchSaveError = (
	error: unknown,
	onShowBranchSelector: () => void,
) => {
	const problemDetails = error as ValidationProblemDetails;
	if (problemDetails?.status === HttpStatusCode.PreconditionFailed) {
		setBranchModalNotification({
			message:
				"This branch/location name already exists. Please enter a unique branch/location name.",
			severity: NotificationSeverity.Error,
		});
	} else {
		setBranchModalNotification({
			message: "There was an error saving your branch/location details.",
			severity: NotificationSeverity.Error,
		});
	}
	onShowBranchSelector();
};

const completeAccountDetails =
	(
		accounts: AccountInfo[],
		instance: IPublicClientApplication,
		accountContext: AccountContextState | null,
		onShowBranchSelector: () => void,
	) =>
	async (
		values: AccountDto,
		_isDirty: boolean,
		_: FormikHelpers<AccountDto>,
		abortSignal?: AbortSignal,
	) => {
		if (accounts.length > 0) {
			try {
				const client = new AccountsClient();
				const tokenResult = await instance.acquireTokenSilent({
					...tokenRequest,
					account: accounts[0],
				});
				client.setAuthToken(tokenResult.accessToken);
				await client.completeBranchAdd(
					{
						// formId: 0,
						formStep: {
							...values,
						},
						// interim fix for address lookup update,
						// as using touched/setFieldTouched/setFieldValue doesn't seem to trigger
						// formik isDirty for the autosuggest unless you blur another control after selection before submission
						// isDirty: true,
					},
					abortSignal,
				);
				const userClient = new UsersClient();
				userClient.setAuthToken(tokenResult.accessToken);
				const user = await userClient.signIn({});

				await handleOrganisationUpdate(values, accountContext, user);

				setBranchModalNotification({
					message: "Your branch/location details have been successfully saved.",
					severity: NotificationSeverity.Success,
				});
				onShowBranchSelector();
			} catch (error) {
				handleBranchSaveError(error, onShowBranchSelector);
			}
		} else {
			throw new Error(
				"There was an error saving your branch/location details.",
			);
		}
	};

const discardChanges: DiscardProps = {
	cancelButtonTitle: "Cancel",
	discardButtonTitle: "Cancel",
	showCancelButton: true,
	locationOnDiscard: "/",
};

const getRedirectionLocationOnError = (
	errorCode: number,
	_errorType: ErrorType,
) => {
	if (errorCode === 412) {
		return "/";
	}
};

const addBranchProps = (
	accounts: AccountInfo[],
	instance: IPublicClientApplication,
	statuses: FormStepStatusDto[],
	accountContext: AccountContextState | null,
	onShowBranchSelector: () => void,
): WizardStepProps<GetAccountValuesDto> => ({
	initialValues: {
		id: "",
		abn: "",
		branchOrLocationName: "",
		isDefaultOrganisation: undefined,
		businessWebsiteAddress: "",
		businessEmailAddress: "",
		contact: {},
		streetAddress: {},
		postalAddressSameAsStreetAddress: undefined,
		postalAddress: {},
		timestamp: "",
	},
	stepStatuses: statuses,
	loadStepValues: loadAccountDetails(accounts, instance),
	location: "/",
	title: "Organisation",
	hidingFields: {
		isDefaultOrganisation: (_x: GetAccountValuesDto) => false,
		postalAddress: (x: GetAccountValuesDto) =>
			x.postalAddressSameAsStreetAddress === true,
		contact: {
			titleOther: (x: GetAccountValuesDto) => x.contact?.title !== "Other",
		},
	},
	validateHard: branchSubmitValidation,
	onSaveAndNext: completeAccountDetails(
		accounts,
		instance,
		accountContext,
		onShowBranchSelector,
	),
	bannerTitle: "Add branch or location",
	discard: discardChanges,
	getRedirectionLocationOnError,
});

export default addBranchProps;
