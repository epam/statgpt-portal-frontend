import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  IconEdit,
  IconSearch,
  IconSettings,
  IconShare,
} from '@tabler/icons-react';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'UI Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    buttonClassName: {
      control: 'select',
      options: [
        'text-button-primary',
        'text-button-secondary',
        'text-button-tertiary',
        'text-button-client',
      ],
    },
  },
  args: {
    buttonClassName: 'text-button-primary',
    icon: <IconEdit size={20} />,
    title: 'Edit',
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Primary: Story = {
  args: {
    buttonClassName: 'text-button-primary',
  },
};

export const Secondary: Story = {
  args: {
    buttonClassName: 'text-button-secondary',
    icon: <IconSearch size={20} />,
    title: 'Search',
  },
};

export const Tertiary: Story = {
  args: {
    buttonClassName: 'text-button-tertiary',
    icon: <IconShare size={20} />,
    title: 'Share',
  },
};

export const Client: Story = {
  args: {
    buttonClassName: 'text-button-client',
    icon: <IconSettings size={20} />,
    title: 'Settings',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithoutBaseStyles: Story = {
  name: 'Without Base Styles',
  args: {
    isBaseIconStyles: false,
    buttonClassName: 'text-button-tertiary p-2',
  },
};
