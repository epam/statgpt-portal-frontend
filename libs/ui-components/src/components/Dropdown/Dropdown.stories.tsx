import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from '../Button/Button';
import { Dropdown } from './Dropdown';

const options = [
  { key: 'option-1', title: 'Option 1' },
  { key: 'option-2', title: 'Option 2' },
  { key: 'option-3', title: 'Option 3' },
];

const TriggerButton = () => (
  <Button
    title="Open dropdown"
    buttonClassName="text-button-primary"
    isSmallButton
  />
);

const withRightAlign = (Story: React.ComponentType) => (
  <div className="flex w-[300px] justify-start">
    <Story />
  </div>
);

const meta: Meta<typeof Dropdown> = {
  title: 'UI Components/Form/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  decorators: [withRightAlign],
  parameters: {
    docs: {
      story: { inline: false, height: '220px' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

const DefaultDemo = () => (
  <Dropdown triggerButton={<TriggerButton />} options={options} />
);

export const Default: Story = {
  render: () => <DefaultDemo />,
};

const WithSelectedDemo = () => (
  <Dropdown
    triggerButton={<TriggerButton />}
    options={options}
    selectedOption="option-2"
  />
);

export const WithSelectedOption: Story = {
  render: () => <WithSelectedDemo />,
};

const WithCustomContentDemo = () => (
  <Dropdown
    triggerButton={<TriggerButton />}
    content={
      <div className="p-4 text-sm text-neutrals-900">Custom panel content</div>
    }
  />
);

export const WithCustomContent: Story = {
  render: () => <WithCustomContentDemo />,
};

const DisabledDemo = () => (
  <Dropdown triggerButton={<TriggerButton />} options={options} disabled />
);

export const Disabled: Story = {
  render: () => <DisabledDemo />,
};
