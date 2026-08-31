import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {MyToastRegion} from './Toast';
import {queue} from './ToastQueue';
import {Button} from '../Buttons/AriaButton/Button';
import {expect, waitFor, within} from 'storybook/test';
import type {Meta, StoryObj} from '@storybook/react-vite';

interface ToastStoryArgs {
  title: string;
  description?: string;
  timeout?: number;
  buttonLabel: string;
}

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Toast',
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs', 'interaction-test'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title of the toast.'
    },
    description: {
      control: 'text',
      description: 'Optional description text.'
    },
    timeout: {
      control: 'number',
      description: 'Auto-dismiss timeout in milliseconds.'
    },
    buttonLabel: {
      control: 'text',
      description: 'Label for the trigger button.'
    }
  },
  args: {
    title: 'Files uploaded',
    description: '3 files uploaded successfully.',
    buttonLabel: 'Show toast'
  }
} satisfies Meta<ToastStoryArgs>;

export default meta;
type Story = StoryObj<ToastStoryArgs>;

export const Example: Story = {
  render: args => (
    <>
      <MyToastRegion />
      <Button
        onPress={() =>
          queue.add(
            {title: args.title, description: args.description},
            args.timeout ? {timeout: args.timeout} : undefined
          )
        }>
        {args.buttonLabel}
      </Button>
    </>
  ),
  parameters: {
    docs: {
      source: {
        transform: () => {
          return `
const queue = new ToastQueue<MyToastContent>();

function MyToast(props: ToastProps<MyToastContent>) {
  return <Toast {...props} />;
}

function MyToastRegion() {
  return (
    <ToastRegion queue={queue}>
      {({toast}) => (
        <MyToast toast={toast}>
          <ToastContent>
            <Text slot="title">{toast.content.title}</Text>
            {toast.content.description && (
              <Text slot="description">{toast.content.description}</Text>
            )}
          </ToastContent>
          <Button slot="close" aria-label="Close" variant="quiet">
            <X size={16} />
          </Button>
        </MyToast>
      )}
    </ToastRegion>
  );
}

<>
  <MyToastRegion />
  <Button onPress={() => queue.add(
    {title: args.title, description: args.description},
    args.timeout ? {timeout: args.timeout} : undefined
  )}>
    {args.buttonLabel}
  </Button>
</>`;
        }
      }
    }
  },
  play: async ({args, canvas, canvasElement, userEvent}) => {
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', {name: args.buttonLabel}));

    const title = await page.findByText(args.title);
    await expect(title).toBeVisible();

    if (args.description) {
      await expect(page.getByText(args.description)).toBeVisible();
    }

    await userEvent.click(page.getByRole('button', {name: 'Close'}));

    await waitFor(() => {
      expect(page.queryByText(args.title)).not.toBeInTheDocument();
    });
  }
};
