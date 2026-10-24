import './styles/index.scss';
import type { ComponentType, ReactElement } from 'react';
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router';
import AuthenticatedElement from './authentication/AuthenticatedElement';
import Home from './components/Home';
import Layout from './components/Layout';
import ErrorDisplay from './components/ErrorBoundary/ErrorDisplay';
import { HttpStatusCode } from './types';
import PreConditions from './routes/preConditions/PreConditions';

type RouteModule<Props extends object = Record<string, never>> = {
  default: ComponentType<Props>;
};

const lazyRoute = <Props extends object>(
  load: () => Promise<RouteModule<Props>>,
  render: (Component: ComponentType<Props>) => ReactElement
) =>
  async function loadRoute() {
    const { default: Component } = await load();

    return {
      Component: function LazyRouteComponent() {
        return render(Component);
      },
    };
  };

const App = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path='/'
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path='/dashboard'
        lazy={lazyRoute(
          () => import('./routes/dashboard'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/dashboard-ta'
        lazy={lazyRoute(
          () => import('./routes/dashboard/dashboard-ta'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/create-account/*'
        lazy={lazyRoute(
          () => import('./routes/account/create'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/update-organisation/:id/*'
        lazy={lazyRoute(
          () => import('./routes/account/update'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/create-contact'
        lazy={lazyRoute(
          () => import('./routes/contact/create'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/update-contact/*'
        lazy={lazyRoute(
          () => import('./routes/contact/update'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/success-creating-account'
        lazy={lazyRoute(
          () => import('./routes/account/created'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/add-branch/*'
        lazy={lazyRoute(
          () => import('./routes/account/addBranch'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/request-for-quote-create'
        lazy={lazyRoute(
          () => import('./routes/requestForQuote/create'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/ta/type-approval-create-pre'
        lazy={lazyRoute(
          () => import('./routes/ta/preApplication'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/ta/:id/*'
        lazy={lazyRoute(
          () => import('./routes/ta'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/ta/type-approval-create'
        lazy={lazyRoute(
          () => import('./routes/ta/create'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/ta/type-approval-success/:id/*'
        lazy={lazyRoute(
          () => import('./routes/ta/created'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/ta/:id/manage'
        lazy={lazyRoute(
          () => import('./routes/ta/manage'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/request-for-quote-copy/:id/*'
        lazy={lazyRoute(
          () => import('./routes/requestForQuote/copy'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/request-for-quote/:id/view-summary/*'
        lazy={lazyRoute(
          () => import('./routes/requestForQuote/viewRequestForQuoteSummary'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component name='' />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/request-for-quote/:id/*'
        lazy={lazyRoute(
          () => import('./routes/requestForQuote'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/request-for-quote-success/:id/*'
        lazy={lazyRoute(
          () => import('./routes/requestForQuote/created'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/submitted-success/:id/*'
        lazy={lazyRoute(
          () => import('./routes/acceptQuote/submittedSuccess'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/accept-quote-create/:id/*'
        lazy={lazyRoute(
          () => import('./routes/acceptQuote/create'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/accept-quote/:id/*'
        lazy={lazyRoute(
          () => import('./routes/acceptQuote'),
          (Component) => (
            <AuthenticatedElement displayHeaderAndFooter={false}>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/quotation/:id/*'
        lazy={lazyRoute(
          () => import('./routes/quotation'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/instrument-reports/:id/*'
        lazy={lazyRoute(
          () => import('./routes/measurementReport/indexList'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/report/:id/*'
        lazy={lazyRoute(
          () => import('./routes/measurementReport'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/services-we-offer'
        lazy={lazyRoute(
          () => import('./routes/services-we-offer'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/sign-in'
        lazy={lazyRoute(
          () => import('./routes/sign-in'),
          (Component) => (
            <AuthenticatedElement>
              <Component />
            </AuthenticatedElement>
          )
        )}
      />
      <Route
        path='/sign-out'
        lazy={lazyRoute(
          () => import('./routes/sign-out'),
          (Component) => (
            <Component />
          )
        )}
      />
      <Route
        path='/sign-out-helper'
        lazy={lazyRoute(
          () => import('./routes/sign-out-helper'),
          (Component) => (
            <Layout>
              <Component />
            </Layout>
          )
        )}
      />
      <Route
        path='/help-guide'
        lazy={lazyRoute(
          () => import('./routes/help-guide'),
          (Component) => (
            <Layout>
              <Component />
            </Layout>
          )
        )}
      />
      <Route
        path='/help-guide/how-to-setup-access'
        lazy={lazyRoute(
          () => import('./routes/help-guide/how-to-setup-access'),
          (Component) => (
            <Layout>
              <Component />
            </Layout>
          )
        )}
      />
      <Route
        path='/help-guide/faqs'
        lazy={lazyRoute(
          () => import('./routes/help-guide/faqs'),
          (Component) => (
            <Layout>
              <Component />
            </Layout>
          )
        )}
      />
      <Route
        path='/server-error'
        element={
          <PreConditions displayHeaderAndFooter>
            <ErrorDisplay status={HttpStatusCode.InternalServerError} />
          </PreConditions>
        }
      />
      <Route
        path='/conflict'
        element={
          <AuthenticatedElement>
            <ErrorDisplay status={HttpStatusCode.Conflict} />
          </AuthenticatedElement>
        }
      />
      <Route
        path='/forbidden'
        element={
          <AuthenticatedElement>
            <ErrorDisplay status={HttpStatusCode.Forbidden} />
          </AuthenticatedElement>
        }
      />
      <Route
        path='/no-longer-available'
        element={
          <AuthenticatedElement>
            <ErrorDisplay status={HttpStatusCode.Gone} />
          </AuthenticatedElement>
        }
      />
      <Route
        path='/unprocessable'
        element={
          <AuthenticatedElement>
            <ErrorDisplay status={HttpStatusCode.UnprocessableEntity} />
          </AuthenticatedElement>
        }
      />
      <Route
        path='/precondition-failed'
        element={
          <AuthenticatedElement>
            <ErrorDisplay status={HttpStatusCode.PreconditionFailed} />
          </AuthenticatedElement>
        }
      />
      <Route
        path='/service-unavailable'
        element={
          <AuthenticatedElement>
            <ErrorDisplay status={HttpStatusCode.ServiceUnavailable} />
          </AuthenticatedElement>
        }
      />
      <Route
        path='/not-found'
        element={
          <PreConditions displayHeaderAndFooter>
            <ErrorDisplay status={HttpStatusCode.NotFound} />
          </PreConditions>
        }
      />
      <Route
        path='*'
        element={
          <PreConditions displayHeaderAndFooter>
            <ErrorDisplay status={HttpStatusCode.NotFound} />
          </PreConditions>
        }
      />
    </>
  ),
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

export default App;
