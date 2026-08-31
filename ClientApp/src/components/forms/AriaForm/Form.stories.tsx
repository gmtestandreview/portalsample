import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {Form} from './Form';
import {Button} from '../../Buttons/AriaButton/Button';
import {TextField} from '../../AriaComponents/TextField';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Form',
  component: Form,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryFn<typeof Form>;

export const Example: Story = args => (
  <Form {...args}>
    <TextField name="email" type="email" isRequired label="Email" placeholder="Enter your email" />
    <Button type="submit">Submit</Button>
  </Form>
);
