import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('./frameworkRoutes/publicLayout.tsx', [
    index('./components/Home.tsx'),
    route('sign-out-helper', './routes/sign-out-helper/index.tsx'),
    route('help-guide', './routes/help-guide/index.tsx'),
    route(
      'help-guide/how-to-setup-access',
      './routes/help-guide/how-to-setup-access.tsx',
    ),
    route('help-guide/faqs', './routes/help-guide/faqs.tsx'),
  ]),
  layout('./frameworkRoutes/authenticatedLayout.tsx', [
    route('dashboard', './routes/dashboard/index.tsx'),
    route('dashboard-ta', './routes/dashboard/dashboard-ta.tsx'),
    route(
      'request-for-quote-create',
      './routes/requestForQuote/create/index.tsx',
    ),
    route('ta/type-approval-create-pre', './routes/ta/preApplication.tsx'),
    route('ta/type-approval-create', './routes/ta/create/index.tsx'),
    route('ta/:id/manage', './routes/ta/manage/index.tsx'),
    route(
      'request-for-quote-copy/:id/*',
      './routes/requestForQuote/copy/index.tsx',
    ),
    route('accept-quote-create/:id/*', './routes/acceptQuote/create/index.tsx'),
    route('quotation/:id/*', './routes/quotation/index.tsx'),
    route(
      'instrument-reports/:id/*',
      './routes/measurementReport/indexList.tsx',
    ),
    route('report/:id/*', './routes/measurementReport/index.tsx'),
    route('services-we-offer', './routes/services-we-offer/index.tsx'),
    route('sign-in', './routes/sign-in/index.tsx'),
    route('conflict', './frameworkRoutes/errors/conflict.tsx'),
    route('forbidden', './frameworkRoutes/errors/forbidden.tsx'),
    route(
      'no-longer-available',
      './frameworkRoutes/errors/noLongerAvailable.tsx',
    ),
    route('unprocessable', './frameworkRoutes/errors/unprocessable.tsx'),
    route(
      'precondition-failed',
      './frameworkRoutes/errors/preconditionFailed.tsx',
    ),
    route(
      'service-unavailable',
      './frameworkRoutes/errors/serviceUnavailable.tsx',
    ),
  ]),
  layout('./frameworkRoutes/authenticatedHeaderlessLayout.tsx', [
    route('create-account/*', './routes/account/create/index.tsx'),
    route('update-organisation/:id/*', './routes/account/update/index.tsx'),
    route('create-contact/*', './routes/contact/create/index.tsx'),
    route('update-contact/*', './routes/contact/update/index.tsx'),
    route('success-creating-account', './routes/account/created/index.tsx'),
    route('add-branch/*', './routes/account/addBranch/index.tsx'),
    route('ta/:id/*', './routes/ta/index.tsx'),
    route('ta/type-approval-success/:id/*', './routes/ta/created/index.tsx'),
    route(
      'request-for-quote/:id/view-summary/*',
      './routes/requestForQuote/viewRequestForQuoteSummary.tsx',
    ),
    route('request-for-quote/:id/*', './routes/requestForQuote/index.tsx'),
    route(
      'request-for-quote-success/:id/*',
      './routes/requestForQuote/created/index.tsx',
    ),
    route(
      'submitted-success/:id/*',
      './routes/acceptQuote/submittedSuccess.tsx',
    ),
    route('accept-quote/:id/*', './routes/acceptQuote/index.tsx'),
  ]),
  route('sign-out', './routes/sign-out/index.tsx'),
  route('server-error', './frameworkRoutes/errors/serverError.tsx'),
  route('not-found', './frameworkRoutes/errors/notFound.tsx'),
  route('*', './frameworkRoutes/errors/notFoundCatchall.tsx'),
] satisfies RouteConfig;
