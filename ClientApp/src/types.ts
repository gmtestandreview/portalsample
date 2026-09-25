export type KeyValue = [key: string, value: unknown];

export type FilterKeys = (keyValue: KeyValue) => boolean;

export type InitialValue<TValues> = {
    [K in keyof TValues]: TValues[K] | '' | InitialValue<TValues[K]>;
};

export enum HttpStatusCode {
    Forbidden = 403,
    NotFound = 404,
    Conflict = 409,
    Gone = 410,
    PreconditionFailed = 412,
    UnprocessableEntity = 422,
    InternalServerError = 500,
    ServiceUnavailable = 503,
}
