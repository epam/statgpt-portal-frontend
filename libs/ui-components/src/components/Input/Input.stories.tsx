import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useId, useState } from 'react';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI Components/Form/Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

const InteractiveInput = () => {
  const id = useId();
  const [value, setValue] = useState('');
  return (
    <Input
      inputId={id}
      value={value}
      onChange={setValue}
      placeholder="Type something..."
    />
  );
};

export const Interactive: Story = { render: () => <InteractiveInput /> };

export const Default: Story = {
  args: {
    inputId: 'input-default',
    value: '',
    placeholder: 'Placeholder text',
  },
};

export const WithValue: Story = {
  args: { inputId: 'input-with-value', value: 'Some text value' },
};

export const Disabled: Story = {
  args: { inputId: 'input-disabled', value: 'Disabled input', disabled: true },
};

export const Invalid: Story = {
  args: {
    inputId: 'input-invalid',
    value: '',
    placeholder: 'Invalid input',
    invalid: true,
  },
};

export const Readonly: Story = {
  args: { inputId: 'input-readonly', value: 'Read-only value', readonly: true },
};

export const Password: Story = {
  args: {
    inputId: 'input-password',
    type: 'password',
    value: 'secret123',
    placeholder: 'Password',
  },
};
