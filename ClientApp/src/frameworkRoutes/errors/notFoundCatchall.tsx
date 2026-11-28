import { HttpStatusCode } from '../../types';
import { createPreconditionErrorRoute } from './errorRoute';

export default createPreconditionErrorRoute(HttpStatusCode.NotFound);
