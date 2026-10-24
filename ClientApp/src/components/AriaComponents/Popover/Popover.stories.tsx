import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Popover } from '../Popover/Popover';
import { Button } from '../Button/Button';
import { DialogTrigger } from '../Dialog/Dialog';
import { Heading } from '../Content/Content';
import { HelpCircle } from '../NmiIcon';
import '../styles.css';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => (
    <DialogTrigger>
      <Button aria-label='Help'>
        <HelpCircle size={18} />
      </Button>
      <Popover {...args} className='react-aria-Popover popover-padding'>
        <Heading slot='title'>Help</Heading>
        <p>For help accessing your account, please contact support.</p>
      </Popover>
    </DialogTrigger>
  ),
  args: {
    children: null,
  },
});
