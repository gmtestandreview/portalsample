import { InteractionType } from "@azure/msal-browser";
import { MsalAuthenticationTemplate, useMsal } from "@azure/msal-react";
import type { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { isRouteErrorResponse, Navigate, useRouteError } from "react-router";
import BlockUiSpinner from "../components/BlockUISpinner/index.tsx";
import ErrorBoundary from "../components/ErrorBoundary/index.tsx";
import { ai } from "../instrumentation/AppInsightsService.ts";
import PreConditions from "../routes/preConditions/PreConditions.tsx";
import { authRequest } from "./authConfig.ts";
import type { AuthenticatedElementProps } from "./types.ts";

const Loading = () => (
	<BlockUiSpinner>
		<p>Logging in...</p>
	</BlockUiSpinner>
);

const RedirectToHome = () => {
	const { instance } = useMsal();
	const error = useRouteError();
	if (isRouteErrorResponse(error)) {
		instance.setActiveAccount(null);
		return error.status === 404 ? (
			<Navigate to="/not-found" />
		) : (
			<Navigate to="/server-error" />
		);
	}

	instance.setActiveAccount(null);
	return <Navigate to="/" />;
};

const AuthenticatedElement = ({
	children,
	displayHeaderAndFooter = true,
}: AuthenticatedElementProps) => (
	<PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
		<MsalAuthenticationTemplate
			interactionType={InteractionType.Redirect}
			authenticationRequest={authRequest}
			loadingComponent={Loading}
			errorComponent={RedirectToHome}
		>
			<ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
				{children}
			</ErrorBoundary>
		</MsalAuthenticationTemplate>
	</PreConditions>
);

export default AuthenticatedElement;
