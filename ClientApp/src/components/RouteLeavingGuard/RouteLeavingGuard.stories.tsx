import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, screen, within } from 'storybook/test';
import { Routes, Route, Link } from 'react-router';
import { Formik, Form } from 'formik';
import RouteLeavingGuard from './index';

const GuardHarness = ({
    when = false,
    title,
    body,
    cancelBtn,
    confirmBtn,
}: {
    when?: boolean;
    title?: string;
    body?: string;
    cancelBtn?: string;
    confirmBtn?: string;
}) => (
    // No MemoryRouter here — the global Storybook decorator in preview.ts provides
    // a RouterProvider via createMemoryRouter. Routes/Route consume that context.
    <Routes>
        <Route
            path="/form"
            element={(
                <Formik initialValues={{}} onSubmit={() => {}}>
                    <Form>
                        <RouteLeavingGuard
                            when={when}
                            title={title}
                            body={body}
                            cancelBtn={cancelBtn}
                            confirmBtn={confirmBtn}
                        />
                        <p>
                            You are on the form page.
                            Changes are{' '}
                            <strong>{when ? 'unsaved' : 'saved'}</strong>.
                        </p>
                        <Link to="/other">Leave this page</Link>
                    </Form>
                </Formik>
            )}
        />
        <Route path="/other" element={<p>You left the page.</p>} />
    </Routes>
);

const meta = {
    title: 'Components/RouteLeavingGuard',
    component: RouteLeavingGuard,
    tags: ['autodocs', 'docs'],
    parameters: {
        portal: { initialEntries: ['/form'] },
        docs: {
            description: {
                component:
                    'Guards SPA navigation when a Formik form has unsaved changes. ' +
                    'Requires both a React Router v6 context (`useBlocker`) and a Formik context (`useFormikContext`). ' +
                    'The guard is inactive when `when={false}`. When `when={true}`, any in-app link click ' +
                    'or programmatic navigation is intercepted and the confirmation modal is shown. ' +
                    'Browser refresh/close is not covered — that path requires a separate `onbeforeunload` handler.',
            },
        },
    },
} satisfies Meta<typeof RouteLeavingGuard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
    name: 'Idle — guard inactive',
    render: () => <GuardHarness when={false} />,
};

export const InterceptedNavigation: Story = {
    name: 'Active — confirmation modal on navigation',
    render: () => <GuardHarness when={true} />,
    play: async ({ canvas }) => {
        // Link is in the canvas (inside Routes); modal renders via Bootstrap portal into document.body
        const link = canvas.getByRole('link', { name: /leave this page/i });
        await userEvent.click(link);
        const dialog = await screen.findByRole('dialog', { name: /unsaved changes/i });
        await expect(dialog).toBeVisible();
        await expect(within(dialog).getByRole('button', { name: /^cancel$/i })).toBeVisible();
        await expect(within(dialog).getByRole('button', { name: /discard changes/i })).toBeVisible();
    },
};

export const CustomCopy: Story = {
    name: 'Custom title, body, and button labels',
    render: () => (
        <GuardHarness
            when={true}
            title="Are you sure you want to log out?"
            body="Any changes made will not be saved if you log out. You can log out, or cancel to stay on the page."
            cancelBtn="Cancel"
            confirmBtn="Yes, logout"
        />
    ),
    play: async ({ canvas }) => {
        const link = canvas.getByRole('link', { name: /leave this page/i });
        await userEvent.click(link);
        const dialog = await screen.findByRole('dialog', { name: /are you sure you want to log out\?/i });
        await expect(dialog).toBeVisible();
        await expect(within(dialog).getByText(/Any changes made will not be saved/)).toBeVisible();
        await expect(within(dialog).getByRole('button', { name: /yes, logout/i })).toBeVisible();
    },
};

export const ProceedAfterConfirm: Story = {
    name: 'Confirm navigation — modal clears and user proceeds',
    render: () => <GuardHarness when={true} />,
    play: async ({ canvas }) => {
        const link = canvas.getByRole('link', { name: /leave this page/i });
        await userEvent.click(link);
        const dialog = await screen.findByRole('dialog', { name: /unsaved changes/i });
        const leaveButton = within(dialog).getByRole('button', { name: /discard changes/i });
        await userEvent.click(leaveButton);
        // After navigation the /other route replaces /form content in canvas
        await expect(canvas.findByText('You left the page.')).resolves.toBeVisible();
    },
};
