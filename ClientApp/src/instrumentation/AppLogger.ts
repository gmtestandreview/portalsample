import { SeverityLevel } from '@microsoft/applicationinsights-common';
import { getAppInsights } from './AppInsightsService';

type AppLoggerProperties = object | null;

class AppLogger {
  static info(message: string, properties?: AppLoggerProperties) {
    this.trace(message, SeverityLevel.Information, properties);
  }

  static warning(message: string, properties?: AppLoggerProperties) {
    this.trace(message, SeverityLevel.Warning, properties);
  }

  static verbose(message: string, properties?: AppLoggerProperties) {
    this.trace(message, SeverityLevel.Verbose, properties);
  }

  static critical(message: string, properties?: AppLoggerProperties) {
    this.trace(message, SeverityLevel.Critical, properties);
  }

  static trace(
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
  }

  static error(
    message: string,
    error: Error,
    properties?: AppLoggerProperties,
  ) {
    const obj = {
      message,
      severityLevel: SeverityLevel.Error,
      error,
    };
    Object.assign(obj, { properties });

    const insights = getAppInsights();
    if (insights) {
      insights.trackException(obj);
    }
  }

  static trackEvent(name: string, properties?: AppLoggerProperties) {
    const obj = { name };
    Object.assign(obj, { properties });

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
