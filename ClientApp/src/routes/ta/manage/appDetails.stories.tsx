import type { Meta, StoryObj } from '@storybook/react-vite';
import { Route, Routes } from 'react-router';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import ApplicationDetails from './appDetails';

/**
 * `ApplicationDetails` is the "Details" tab of the type-approval management surface. It
 * reads the application id from the route, loads the application's status, reference,
 * dates and assessment on mount, and presents them in accordions. It fetches eagerly
 * (with no empty state and no id-less render), so the story matches the `/ta/:id/manage`
 * route and stubs the details API so the populated tab renders.
 */
const applicationDetails = {
    patternApprovalType: 'Non-automatic weighing instrument',
    messageCount: 0,
    referenceId: 'PA-2024-0001',
    status: 'Submitted',
    statusDetail: 'Under assessment by NMI',
    title: 'Non-automatic weighing instrument',
    submittedDate: '2024-03-01T00:00:00Z',
    lastUpdated: '2024-03-20T00:00:00Z',
    assessedAs: 'Class II',
};

const stubFetch: typeof globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
    if (url.includes('app-details')) {
        return new Response(JSON.stringify({ applicationDetails }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    }
    // Other calls (e.g. message count) — return a benign numeric payload.
    return new Response('0', { status: 200, headers: { 'content-type': 'application/json' } });
};

const meta = {
    title: 'Routes/TypeApproval/Manage/ApplicationDetails',
    component: ApplicationDetails,
    decorators: [
        withPortalProviders,
        // Consume the ambient router so useParams() resolves :id from the location.
        (Story) => (
            <Routes>
                <Route path='/ta/:id/manage' element={<Story />} />
            </Routes>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/ta/PA-2024-0001/manage'],
            fetch: stubFetch,
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ApplicationDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DetailsTab: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Once the application loads, the status section and reference render.
        await expect(await canvas.findByRole('heading', { name: 'Application status' })).toBeInTheDocument();
        await expect(await canvas.findByText('PA-2024-0001')).toBeVisible();
    },
};
