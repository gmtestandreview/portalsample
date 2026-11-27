import ErrorDisplay from '../../components/ErrorBoundary/ErrorDisplay';
import PreConditions from '../../routes/preConditions/PreConditions';
import type { HttpStatusCode } from '../../types';

export const createAuthenticatedErrorRoute = (status: HttpStatusCode) =>
  function AuthenticatedErrorRoute() {
    return <ErrorDisplay status={status} />;
  };

export const createPreconditionErrorRoute = (status: HttpStatusCode) =>
  function PreconditionErrorRoute() {
    return (
      <PreConditions displayHeaderAndFooter>
        <ErrorDisplay status={status} />
      </PreConditions>
    );
  };
