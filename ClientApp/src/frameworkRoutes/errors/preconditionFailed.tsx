import { HttpStatusCode } from '../../types';
import { createAuthenticatedErrorRoute } from './errorRoute';

export default createAuthenticatedErrorRoute(HttpStatusCode.PreconditionFailed);
