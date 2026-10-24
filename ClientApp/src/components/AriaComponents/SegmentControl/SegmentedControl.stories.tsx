import preview from '../../../../../.storybook/preview';
import { expect, fn } from 'storybook/test';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { SegmentedControl, SegmentedControlItem } from './SegmentedControl';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Components/AriaComponents/SegmentedControl',
  component: SegmentedControl,
  subcomponents: { SegmentedControlItem },
});

const segments = (disabledId?: string): React.ReactNode => (
  <>
    <SegmentedControlItem id='overview'>Overview</SegmentedControlItem>
    <SegmentedControlItem id='reports' isDisabled={disabledId === 'reports'}>
      Reports
    </SegmentedControlItem>
    <SegmentedControlItem id='settings'>Settings</SegmentedControlItem>
  </>
);

export const SelectionChanges = meta.story({
  args: {
    defaultSelectedKeys: ['overview'],
    onSelectionChange: fn(),
    selectionMode: 'single',
  },
  render: (args) => <SegmentedControl {...args}>{segments()}</SegmentedControl>,
  play: async ({ args, canvas, userEvent }) => {
    const reports = canvas.getByRole('radio', { name: 'Reports' });

    await expect(
      canvas.getByRole('radio', { name: 'Overview' }),
    ).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(reports);

    await expect(reports).toHaveAttribute('aria-checked', 'true');
    await expect(args.onSelectionChange).toHaveBeenCalledWith(
      new Set(['reports']),
    );
  },
});

export const KeyboardSelection = meta.story({
  args: {
    onSelectionChange: fn(),
    selectionMode: 'single',
  },
  render: (args) => <SegmentedControl {...args}>{segments()}</SegmentedControl>,
  play: async ({ canvas, userEvent }) => {
    const overview = canvas.getByRole('radio', { name: 'Overview' });
    await userEvent.tab();

    await expect(overview).toHaveFocus();

    await userEvent.keyboard('{Enter}');

    await expect(overview).toHaveAttribute('aria-checked', 'true');
  },
});

export const DisabledItem = meta.story({
  args: {
    defaultSelectedKeys: ['overview'],
    selectionMode: 'single',
  },
  render: (args) => (
    <SegmentedControl {...args}>{segments('reports')}</SegmentedControl>
  ),
  play: async ({ canvas, userEvent }) => {
    const reports = canvas.getByRole('radio', { name: 'Reports' });

    await expect(reports).toBeDisabled();

    await userEvent.click(reports);

    await expect(reports).toHaveAttribute('aria-checked', 'false');
  },
});
