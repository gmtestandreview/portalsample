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
    // Explicit opt-out sentinel. Storybook and local dev set this to disable
    // telemetry deliberately, which is different from forgetting to configure it.
    const DISABLED_CONN_STRING = 'dummy-key';

    const connString = env.REACT_APP_APPINSIGHTS_CONN_STRING;
    if (!connString || connString === DISABLED_CONN_STRING) {
        // Warn only when the string is absent - that may be a misconfiguration
        // worth a developer's attention. The sentinel is a deliberate choice, so
        // announcing it once per module instantiation is just noise that buries
        // warnings that do mean something.
        if (!connString && env.REACT_APP_ENVIRONMENT === 'development') {
             
            console.warn('[AppInsights] Telemetry is DISABLED: missing connection string.');
        }
        return { reactPlugin: null, appInsights: null };
    }
    initialise(connString);
    return { reactPlugin, appInsights };
};

export const ai = createTelemetryService();
export const getAppInsights = () => appInsights;
