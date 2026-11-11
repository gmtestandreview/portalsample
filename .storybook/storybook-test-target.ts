import { resolveStorybookTestTargetImplementation } from './storybook-test-target.mjs';

export type StorybookServerMode = 'managed' | 'external';

export interface StorybookWebServer {
  command: string;
  url: string;
  reuseExistingServer: boolean;
  timeout: number;
}

export interface StorybookTestTarget {
  baseURL: string;
  mcpURL: string;
  command: string;
  webServer: StorybookWebServer | undefined;
}

export interface StorybookTestTargetOptions {
  url?: string;
  serverMode?: string;
  ci?: boolean;
}

export const resolveStorybookTestTarget = (
  options: StorybookTestTargetOptions = {},
): StorybookTestTarget => resolveStorybookTestTargetImplementation(options);
