export interface MockFailure {
    status: number;
    body?: Record<string, unknown>;
    once?: boolean;
}

export const failureKey = (method: string, pathname: string) => (
    `${method.toUpperCase()} ${pathname}`
);
