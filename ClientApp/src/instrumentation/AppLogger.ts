import { SeverityLevel } from '@microsoft/applicationinsights-common';
import { getAppInsights } from './AppInsightsService';

type AppLoggerProperties = object | null;

const AppLogger = {
  info(message: string, properties?: AppLoggerProperties) {
    AppLogger.trace(message, SeverityLevel.Information, properties);
  },

  warning(message: string, properties?: AppLoggerProperties) {
    AppLogger.trace(message, SeverityLevel.Warning, properties);
  },

  verbose(message: string, properties?: AppLoggerProperties) {
    AppLogger.trace(message, SeverityLevel.Verbose, properties);
  },

  critical(message: string, properties?: AppLoggerProperties) {
    AppLogger.trace(message, SeverityLevel.Critical, properties);
  },

  trace(
    message: string,
    severityLevel: SeverityLevel,
    properties?: AppLoggerProperties,
  ) {
    const obj = { message, severityLevel };
    Object.assign(obj, { properties });

    const insights = getAppInsights();
    if (insights) {
      insights.trackTrace(obj);
    }
  },

  error(message: string, error: Error, properties?: AppLoggerProperties) {
    const obj = {
      message,
      severityLevel: SeverityLevel.Error,
      exception: error,
    };
    Object.assign(obj, { properties });

    const insights = getAppInsights();
    if (insights) {
      insights.trackException(obj);
    }
  },

  trackEvent(name: string, properties?: AppLoggerProperties) {
    const obj = { name };
    Object.assign(obj, { properties });

    const insights = getAppInsights();
    if (insights) {
      insights.trackEvent(obj);
    }
  },

  startTrackPage(name: string) {
    const insights = getAppInsights();
    if (insights) {
      insights.startTrackPage(name);
    }
  },

  stopTrackPage(name: string) {
    const insights = getAppInsights();
    if (insights) {
      insights.stopTrackPage(name);
    }
  },

  startTrackEvent(name: string) {
    const insights = getAppInsights();
    if (insights) {
      insights.startTrackEvent(name);
    }
  },

  stopTrackEvent(name: string) {
    const insights = getAppInsights();
    if (insights) {
      insights.stopTrackEvent(name);
    }
  },
};

export default AppLogger;
