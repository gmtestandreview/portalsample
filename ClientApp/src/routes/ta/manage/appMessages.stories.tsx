import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { http, HttpResponse } from 'msw/http';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import ApplicationMessages from './appMessages';

/**
 * `ApplicationMessages` is the "Messages" tab of the type-approval management surface.
 * It provides a rich-text composer (the `SlateEditor`) plus a paged thread of messages
 * between the applicant and NMI. The story loads an empty thread and exercises the composer.
 */
const meta = {
  title: 'Routes/TypeApproval/Manage/ApplicationMessages',
  component: ApplicationMessages,
  decorators: [withPortalProviders],
  beforeEach({ msw }) {
    msw.use(
      http.get('/api/request-for-pattern-approval/PA-1/app-messages', () =>
        HttpResponse.json({
          requestForPatternApprovalMessageDetails: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            items: [],
          },
        })
      )
    );
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      initialEntries: ['/ta/PA-1/manage?tab=messages'],
      routePath: '/ta/:id/manage',
    },
  },
} satisfies Meta<typeof ApplicationMessages>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MessagesTab: Story = {
  play: async ({
    canvas,
    userEvent,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    await expect(
      await canvas.findByText('No messages to display')
    ).toBeVisible();
    await expect(
      canvas.getByRole('combobox', { name: 'Select your view' })
    ).toBeEnabled();
    const getEditor = () =>
      canvas.getByRole('textbox', { name: 'Message NMI' });
    // click()/type() aim at the element centre, which is Slate's noneditable
    // placeholder, so the keystrokes are lost. Offset 0 targets the editable text.
    // Keystrokes sent before the caret is inside the editor are also dropped, so
    // retry the focus until the selection has landed there before typing.
    await waitFor(
      async () => {
        const editor = getEditor();
        editor.focus();
        await userEvent.pointer({
          target: editor,
          offset: 0,
          keys: '[MouseLeft]',
        });
        const anchor = globalThis.getSelection()?.anchorNode ?? null;
        expect(anchor !== null && editor.contains(anchor)).toBe(true);
      },
      { timeout: 5000 }
    );
    await userEvent.keyboard('Hi');
    // Slate commits typed text through a deferred React render, so the
    // placeholder can still be in the DOM when keyboard() resolves under load.
    await waitFor(() => expect(getEditor()).toHaveTextContent('Hi'));
    await expect(await canvas.findByText(/^9\s*\//)).toBeVisible();
  },
};
