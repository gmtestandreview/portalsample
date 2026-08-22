import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { env } from '../env';

let reactPlugin: ReactPlugin | null = null;
let appInsights: ApplicationInsights | null = null;

/**
 * Create the App Insights Telemetry Service
 * @return {{reactPlugin: ReactPlugin, appInsights: Object, initialize: Function}} - Object
 */

const createTelemetryService = () => {
    /**
     * Initialize the Application Insights class
     * @return {void}
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialise = (connectionString: string): void => {
        reactPlugin = new ReactPlugin();
        appInsights = new ApplicationInsights({
            config: {
                connectionString,
                disableInstrumentationKeyValidation: true,
                disablePageUnloadEvents: ['unload'],
                enableAutoRouteTracking: true,
                extensions: [reactPlugin as never],
            },
        });
        appInsights!.loadAppInsights();
    };
    const connString = env.REACT_APP_APPINSIGHTS_CONN_STRING;
    if (!connString || connString === 'dummy-key') {
        // Explicitly disable/fail telemetry if config is missing or dummy
        if (env.REACT_APP_ENVIRONMENT === 'development') {
            // eslint-disable-next-line no-console
            console.warn('[AppInsights] Telemetry is DISABLED: missing or dummy connection string.');
        }
        return { reactPlugin: null, appInsights: null };
    }
    initialise(connString);
    return { reactPlugin, appInsights };
};

export const ai = createTelemetryService();
export const getAppInsights = () => appInsights;
