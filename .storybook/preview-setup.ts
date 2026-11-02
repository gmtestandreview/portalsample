import { VITE_ENV_FIXTURES } from '../runtime-env-fixtures';

// Runtime env stubs — Storybook has no deployment .env file, so every browser
// exposed Vite variable is supplied as a deterministic fixture here.
//
// The telemetry values are deterministic non-production fixtures. App Insights
// uses the explicit `dummy-key` opt-out sentinel, so Storybook never sends
// telemetry while env.ts can still validate every required runtime value.
// 'dummy-key' is the exact sentinel AppInsightsService checks for. A
// realistic-looking connection string is truthy and passes that check, so
// the real SDK booted and every story load fetched js.monitor.azure.com,
// which answers 500 for a fake instrumentation key.
Object.assign(import.meta.env, VITE_ENV_FIXTURES.storybook);
