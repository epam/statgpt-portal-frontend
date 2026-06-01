import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useId, useState } from 'react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    label: 'Checkbox label',
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

const InteractiveCheckbox = () => {
  const id = useId();
  const [checked, setChecked] = useState(false);
  return (
    <Checkbox
      id={id}
      label="Checkbox label"
      checked={checked}
      onChange={(_, isChecked) => setChecked(isChecked ?? !checked)}
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveCheckbox />,
};

export const Unchecked: Story = {
  args: {
    id: 'unchecked',
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    id: 'checked',
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    id: 'disabled',
    checked: false,
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  name: 'Disabled Checked',
  args: {
    id: 'disabled-checked',
    checked: true,
    disabled: true,
  },
};

export const WithoutLabel: Story = {
  name: 'Without Label',
  args: {
    id: 'without-label',
    checked: false,
    label: undefined,
  },
};
