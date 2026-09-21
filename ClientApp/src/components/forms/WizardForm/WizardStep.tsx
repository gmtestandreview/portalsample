import type { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import type { FormikValues } from "formik";
import GoogleAnalytics from "../../../analytics/GoogleAnalytics";
import { ai } from "../../../instrumentation/AppInsightsService";
import ErrorBoundary from "../../ErrorBoundary";
import type { WizardStepProps } from "./types";

const WizardStep = <T extends FormikValues>(props: WizardStepProps<T>) => {
	const { children } = props;

	return (
		<ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
			<GoogleAnalytics anonymiseIp={false} testMode={false} sendPageView>
				{children}
			</GoogleAnalytics>
		</ErrorBoundary>
	);
};

export default WizardStep;
