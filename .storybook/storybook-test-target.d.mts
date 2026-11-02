export type StorybookServerMode = 'managed' | 'external';

export type StorybookWebServer = {
  command: string;
  url: string;
  reuseExistingServer: boolean;
  timeout: number;
};

export type StorybookTestTarget = {
  baseURL: string;
  mcpURL: string;
  command: string;
  webServer: StorybookWebServer | undefined;
};

export type StorybookTestTargetOptions = {
  url?: string;
  serverMode?: string;
  ci?: boolean;
};

export declare const resolveStorybookTestTargetImplementation: (
  options?: StorybookTestTargetOptions,
) => StorybookTestTarget;

export declare const resolveStorybookTestTarget: typeof resolveStorybookTestTargetImplementation;
