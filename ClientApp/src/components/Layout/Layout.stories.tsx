import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from 'react-bootstrap';
import { expect, screen, waitFor } from 'storybook/test';
import Layout from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Components/Layout',
    component: Layout,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Layout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PortalShell: Story = {
    args: {
        children: null,
    },
    render: () => (
        <Layout>
            <Container className='py-5'>
                <h1 className='mb-3'>Example content</h1>
                <p className='mb-0'>
                    This story exercises the full page chrome that route stories inherit:
                    skip links, header, footer, analytics wrapper and accessibility helpers.
                </p>
            </Container>
        </Layout>
    ),
    play: async () => {
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Navigated to'));
    },
};
