import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ListBox, ListBoxItem, ListBoxSection } from './ListBox';
import { Header } from 'react-aria-components/Header';
import type { StoryFn } from '@storybook/react-vite';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ListBox',
  component: ListBox,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof ListBox>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => (
    <ListBox aria-label='Ice cream flavor' {...args}>
      <ListBoxItem>Chocolate</ListBoxItem>
      <ListBoxItem>Mint</ListBoxItem>
      <ListBoxItem>Strawberry</ListBoxItem>
      <ListBoxItem>Vanilla</ListBoxItem>
    </ListBox>
  ),

  args: {
    selectionMode: 'single',
  },
});

export const Sections = meta.story(() => (
  <ListBox aria-label='Sandwich contents' selectionMode='multiple'>
    <ListBoxSection>
      <Header>Veggies</Header>
      <ListBoxItem id='lettuce'>Lettuce</ListBoxItem>
      <ListBoxItem id='tomato'>Tomato</ListBoxItem>
      <ListBoxItem id='onion'>Onion</ListBoxItem>
    </ListBoxSection>
    <ListBoxSection>
      <Header>Protein</Header>
      <ListBoxItem id='ham'>Ham</ListBoxItem>
      <ListBoxItem id='tuna'>Tuna</ListBoxItem>
      <ListBoxItem id='tofu'>Tofu</ListBoxItem>
    </ListBoxSection>
    <ListBoxSection>
      <Header>Condiments</Header>
      <ListBoxItem id='mayo'>Mayonaise</ListBoxItem>
      <ListBoxItem id='mustard'>Mustard</ListBoxItem>
      <ListBoxItem id='ranch'>Ranch</ListBoxItem>
    </ListBoxSection>
  </ListBox>
));
