import preview from '../../../../.storybook/preview';
import { Container } from 'react-bootstrap';
import { expect, screen, waitFor } from 'storybook/test';
import Layout from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Components/Layout',
  component: Layout,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
  },
});

export const PortalShell = meta.story({
  args: {
    children: null,
  },
  render: () => (
    <Layout>
      <Container className='py-5'>
        <h1 className='mb-3'>Example content</h1>
        <p className='mb-0'>
          This story exercises the full page chrome that route stories inherit:
          skip links, header, footer, analytics wrapper and accessibility
          helpers.
        </p>
      </Container>
    </Layout>
  ),
  play: async () => {
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Navigated to'),
    );
  },
});
