import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import type { FormikValues } from 'formik';
import GoogleAnalytics from '../../../analytics/GoogleAnalytics.tsx';
import { ai } from '../../../instrumentation/AppInsightsService.ts';
import ErrorBoundary from '../../ErrorBoundary/index.tsx';
import type { WizardStepProps } from './types.ts';

const WizardStep = <T extends FormikValues>(props: WizardStepProps<T>) => {
  const { children } = props;

  return (
    <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
      <GoogleAnalytics anonymiseIp={false} testMode={false} sendPageView={true}>
        {children}
      </GoogleAnalytics>
    </ErrorBoundary>
  );
};

export default WizardStep;
