import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ListBox, ListBoxItem, ListBoxSection} from './ListBox';
import {Header} from 'react-aria-components/Header';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ListBox',
  component: ListBox,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof ListBox>;

export default meta;
type Story = StoryFn<typeof ListBox>;

export const Example: Story = args => (
  <ListBox aria-label="Ice cream flavor" {...args}>
    <ListBoxItem>Chocolate</ListBoxItem>
    <ListBoxItem>Mint</ListBoxItem>
    <ListBoxItem>Strawberry</ListBoxItem>
    <ListBoxItem>Vanilla</ListBoxItem>
  </ListBox>
);

Example.args = {
  onAction: undefined,
  selectionMode: 'single'
};

export const Sections: Story = () => (
  <ListBox aria-label="Sandwich contents" selectionMode="multiple">
    <ListBoxSection>
      <Header>Veggies</Header>
      <ListBoxItem id="lettuce">Lettuce</ListBoxItem>
      <ListBoxItem id="tomato">Tomato</ListBoxItem>
      <ListBoxItem id="onion">Onion</ListBoxItem>
    </ListBoxSection>
    <ListBoxSection>
      <Header>Protein</Header>
      <ListBoxItem id="ham">Ham</ListBoxItem>
      <ListBoxItem id="tuna">Tuna</ListBoxItem>
      <ListBoxItem id="tofu">Tofu</ListBoxItem>
    </ListBoxSection>
    <ListBoxSection>
      <Header>Condiments</Header>
      <ListBoxItem id="mayo">Mayonaise</ListBoxItem>
      <ListBoxItem id="mustard">Mustard</ListBoxItem>
      <ListBoxItem id="ranch">Ranch</ListBoxItem>
    </ListBoxSection>
  </ListBox>
);
