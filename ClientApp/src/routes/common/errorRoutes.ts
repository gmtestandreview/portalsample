import { HttpStatusCode } from '../../types';

const getUnexpectedErrorRoute = (status: number | undefined) => {
    switch (status) {
        case HttpStatusCode.Conflict:
            return '/conflict';
        case HttpStatusCode.Gone:
            return '/no-longer-available';
        case HttpStatusCode.PreconditionFailed:
            return '/precondition-failed';
        case HttpStatusCode.ServiceUnavailable:
            return '/service-unavailable';
        case HttpStatusCode.UnprocessableEntity:
            return '/unprocessable';
        case HttpStatusCode.Forbidden:
            return '/forbidden';
        case HttpStatusCode.InternalServerError:
            return '/server-error';
        default:
            return '/server-error';
    }
};

export default getUnexpectedErrorRoute;
