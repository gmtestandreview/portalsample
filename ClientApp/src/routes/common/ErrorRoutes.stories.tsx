import type { Meta, StoryObj } from '@storybook/react-vite';
import ErrorDisplay from '../../components/ErrorBoundary/ErrorDisplay';
import { HttpStatusCode } from '../../types';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Routes/ErrorStates',
    component: ErrorDisplay,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            initialEntries: ['/not-found'],
        },
    },
} satisfies Meta<typeof ErrorDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotFound: Story = {
    args: { status: HttpStatusCode.NotFound },
};

export const Forbidden: Story = {
    args: { status: HttpStatusCode.Forbidden },
};

export const Conflict: Story = {
    args: { status: HttpStatusCode.Conflict },
};

export const NoLongerAvailable: Story = {
    args: { status: HttpStatusCode.Gone },
};

export const Unprocessable: Story = {
    args: { status: HttpStatusCode.UnprocessableEntity },
};

export const PreconditionFailed: Story = {
    args: { status: HttpStatusCode.PreconditionFailed },
};

export const ServiceUnavailable: Story = {
    args: { status: HttpStatusCode.ServiceUnavailable },
};

export const ServerError: Story = {
    args: { status: HttpStatusCode.InternalServerError },
};
