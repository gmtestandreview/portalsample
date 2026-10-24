import preview from '../../../../.storybook/preview';
import ErrorDisplay from '../../components/ErrorBoundary/ErrorDisplay';
import { HttpStatusCode } from '../../types';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Routes/ErrorStates',
  component: ErrorDisplay,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      initialEntries: ['/not-found'],
    },
  },
});

export const NotFound = meta.story({
  args: { status: HttpStatusCode.NotFound },
});

export const Forbidden = meta.story({
  args: { status: HttpStatusCode.Forbidden },
});

export const Conflict = meta.story({
  args: { status: HttpStatusCode.Conflict },
});

export const NoLongerAvailable = meta.story({
  args: { status: HttpStatusCode.Gone },
});

export const Unprocessable = meta.story({
  args: { status: HttpStatusCode.UnprocessableEntity },
});

export const PreconditionFailed = meta.story({
  args: { status: HttpStatusCode.PreconditionFailed },
});

export const ServiceUnavailable = meta.story({
  args: { status: HttpStatusCode.ServiceUnavailable },
});

export const ServerError = meta.story({
  args: { status: HttpStatusCode.InternalServerError },
});
