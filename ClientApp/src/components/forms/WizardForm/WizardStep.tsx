import type { FormikValues } from 'formik';
import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import type { WizardStepProps } from './types';
import ErrorBoundary from '../../ErrorBoundary';
import { ai } from '../../../instrumentation/AppInsightsService';
import GoogleAnalytics from '../../../analytics/GoogleAnalytics';

const WizardStep = <T extends FormikValues>(props: WizardStepProps<T>) => {
    const {
        children,
    } = props;

    return (
        <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
            <GoogleAnalytics
                anonymiseIp={false}
                testMode={false}
                sendPageView
            >
                {children}
            </GoogleAnalytics>
        </ErrorBoundary>
    );
};

export default WizardStep;
