import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { describe, expect, it } from 'vitest';

describe('application Insights package compatibility', () => {
  it('constructs the React plugin with the web SDK', () => {
    const reactPlugin = new ReactPlugin();
    const appInsights = new ApplicationInsights({
      config: {
        connectionString:
          'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        extensions: [reactPlugin],
      },
    });

    expect(reactPlugin).toBeInstanceOf(ReactPlugin);
    expect(appInsights).toBeInstanceOf(ApplicationInsights);
    expect(appInsights.config.extensions).toContain(reactPlugin);
  });
});
