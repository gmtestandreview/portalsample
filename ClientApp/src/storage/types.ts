export interface Notification {
  message: string;
  severity: NotificationSeverity;
}

export enum NotificationSeverity {
  Success = 'Success',
  Information = 'Information',
  Warning = 'Warning',
  Error = 'Error',
}

export interface TargetOrganisation {
  targetOrganisationAbn: string;
  targetOrganisationName: string;
}

export interface StorageCache {
  getItem: <T>(
    key: string,
    deserialize?: (value: unknown) => T,
  ) => T | undefined;
  setItem: <T>(item: T, key: string, serialize?: (value: T) => string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}
