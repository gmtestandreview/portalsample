/* eslint-disable no-console */
import { SeverityLevel } from '@microsoft/applicationinsights-common';
import { getAppInsights } from './AppInsightsService';

class AppLogger {
    static info(message: string, properties?: any) {
        this.trace(message, SeverityLevel.Information, properties);
    }

    static warning(message: string, properties?: any) {
        this.trace(message, SeverityLevel.Warning, properties);
    }

    static verbose(message: string, properties?: any) {
        this.trace(message, SeverityLevel.Verbose, properties);
    }

    static critical(message: string, properties?: any) {
        this.trace(message, SeverityLevel.Critical, properties);
    }

    static trace(message: string, severityLevel: SeverityLevel, properties?: any) {
        const obj = {
            message,
            severityLevel,
            properties,
        };

        const insights = getAppInsights();
        if (insights) {
            insights.trackTrace(obj);
        }
    }

    static error(message: string, error: Error, properties?: any) {
        const obj = {
            message,
            severityLevel: SeverityLevel.Error,
            error,
            properties,
        };

        const insights = getAppInsights();
        if (insights) {
            insights.trackException(obj);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static trackEvent(name: string, properties?: any) {
        const obj = {
            name,
            properties,
        };

        const insights = getAppInsights();
        if (insights) {
            insights.trackEvent(obj);
        }
    }

    static startTrackPage(name: string) {
        const insights = getAppInsights();
        if (insights) {
            insights?.startTrackPage(name);
        }
    }

    static stopTrackPage(name: string) {
        const insights = getAppInsights();
        if (insights) {
            insights?.stopTrackPage(name);
        }
    }

    static startTrackEvent(name: string) {
        const insights = getAppInsights();
        if (insights) {
            insights?.startTrackEvent(name);
        }
    }

    static stopTrackEvent(name: string) {
        const insights = getAppInsights();
        if (insights) {
            insights?.stopTrackEvent(name);
        }
    }
}

export default AppLogger;
