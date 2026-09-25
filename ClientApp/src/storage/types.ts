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
    getItem: <T> (key: string) => T | undefined;
    setItem: <T> (item: T, key: string) => void;
    removeItem: (key: string) => void;
    clear: () => void;
}
