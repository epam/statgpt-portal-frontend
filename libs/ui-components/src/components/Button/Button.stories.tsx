import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { IconArrowRight, IconStar } from '@tabler/icons-react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    buttonClassName: {
      control: { type: 'select' },
      options: [
        'text-button-primary',
        'text-button-secondary',
        'text-button-tertiary',
        'text-button-client',
        'text-button-primary-error',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    title: 'Button',
    buttonClassName: 'text-button-primary',
  },
};

export const Secondary: Story = {
  args: {
    title: 'Button',
    buttonClassName: 'text-button-secondary',
  },
};

export const Tertiary: Story = {
  args: {
    title: 'Button',
    buttonClassName: 'text-button-tertiary',
  },
};

export const Client: Story = {
  args: {
    title: 'Button',
    buttonClassName: 'text-button-client',
  },
};

export const Disabled: Story = {
  args: {
    title: 'Button',
    buttonClassName: 'text-button-primary',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    title: 'Button',
    buttonClassName: 'text-button-primary',
    isLoading: true,
  },
};

export const Small: Story = {
  args: {
    title: 'Button',
    buttonClassName: 'text-button-primary',
    isSmallButton: true,
  },
};

export const WithIconBefore: Story = {
  name: 'With Icon Before',
  args: {
    title: 'Button',
    buttonClassName: 'text-button-primary',
    iconBefore: <IconStar size={16} />,
  },
};

export const WithIconAfter: Story = {
  name: 'With Icon After',
  args: {
    title: 'Button',
    buttonClassName: 'text-button-secondary',
    iconAfter: <IconArrowRight size={16} />,
  },
};
