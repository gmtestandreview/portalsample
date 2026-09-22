import type {
	AccountInfo,
	IPublicClientApplication,
} from "@azure/msal-browser";
import type { FormikHelpers } from "formik";
import type {
	AccountDto,
	FormStepStatusDto,
	GetAccountValuesDto,
} from "../../../api/web-api-client.ts";
import { AccountsClient } from "../../../api/web-api-client.ts";
import type { AccountContextState } from "../../../authentication/accountContext.tsx";
import { tokenRequest } from "../../../authentication/authConfig.ts";
import type { DiscardProps } from "../../../components/forms/FormikForm/types.ts";
import type {
	ErrorType,
	WizardFormStepValues,
	WizardStepProps,
} from "../../../components/forms/WizardForm/types.ts";
import accountSubmitValidation from "../validation.ts";

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

			const businessDetailsStep =
				await client.getNewAccountDetails(abortSignal);

			const wizardStepValues: WizardFormStepValues<GetAccountValuesDto> = {
				stepValues: { ...businessDetailsStep.stepValues },
			};

			return wizardStepValues;
		}

		throw new Error(
			"There was an error retrieving your organisation and contact details.",
		);
	};

const completeAccountDetails =
	(
		accounts: AccountInfo[],
		instance: IPublicClientApplication,
		accountContext: AccountContextState | null,
	) =>
	async (
		values: AccountDto,
		isDirty: boolean,
		_: FormikHelpers<AccountDto>,
		abortSignal?: AbortSignal,
	) => {
		if (accounts.length > 0) {
			const client = new AccountsClient();
			const tokenResult = await instance.acquireTokenSilent({
				...tokenRequest,
				account: accounts[0],
			});
			client.setAuthToken(tokenResult.accessToken);
			await client.completeAccountDetails(
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
			accountContext?.setOrganisationAndBranch(
				values.name!,
				values.businessOrTradingName ?? "",
				values.branchOrLocationName ?? "",
			);
			accountContext?.setCompleted();
		} else {
			throw new Error(
				"There was an error saving your organisation and contact details.",
			);
		}
	};

const discardChanges: DiscardProps = {
	cancelButtonTitle: "Cancel",
	discardButtonTitle: "Cancel",
	showCancelButton: true,
	locationOnDiscard: "/sign-out",
};

const getRedirectionLocationOnError = (
	errorCode: number,
	_errorType: ErrorType,
) => {
	if (errorCode === 412) {
		return "/";
	}
};

const createAccountProps = (
	accounts: AccountInfo[],
	instance: IPublicClientApplication,
	statuses: FormStepStatusDto[],
	accountContext: AccountContextState | null,
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
		isDefaultOrganisation: (x: GetAccountValuesDto) =>
			x.isDefaultOrganisation === true,
		postalAddress: (x: GetAccountValuesDto) =>
			x.postalAddressSameAsStreetAddress === true,
		contact: {
			titleOther: (x: GetAccountValuesDto) => x.contact?.title !== "Other",
		},
	},
	validateHard: accountSubmitValidation,
	onSaveAndNext: completeAccountDetails(accounts, instance, accountContext),
	bannerTitle: "Create portal account",
	discard: discardChanges,
	getRedirectionLocationOnError,
});

export default createAccountProps;
