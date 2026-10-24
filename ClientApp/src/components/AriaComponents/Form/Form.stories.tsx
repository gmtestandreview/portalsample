import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Form } from '../Form/Form';
import { Button } from '../Button/Button';
import { TextField } from '../TextField/TextField';
import type { StoryFn } from '@storybook/react-vite';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Form',
  component: Form,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof Form>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => (
    <Form {...args}>
      <TextField
        name='email'
        type='email'
        isRequired
        label='Email'
        placeholder='Enter your email'
      />
      <Button type='submit'>Submit</Button>
    </Form>
  ),
});
