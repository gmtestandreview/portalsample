import type { FormValues } from '../types';
import type { WizardStepProps } from './types';
import ErrorBoundary from '../../ErrorBoundary';
import { ai } from '../../../instrumentation/AppInsightsService';
import GoogleAnalytics from '../../../analytics/GoogleAnalyticsTracker';

const WizardStep = <T extends FormValues>(
  props: Readonly<WizardStepProps<T>>,
) => {
  const { children } = props;

  return (
    <ErrorBoundary appInsights={ai.reactPlugin}>
      <GoogleAnalytics anonymiseIp={false} testMode={false} sendPageView>
        {children}
      </GoogleAnalytics>
    </ErrorBoundary>
  );
};

export default WizardStep;
