import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { CopyButton } from './CopyButton';

const meta: Meta<typeof CopyButton> = {
  title: 'UI Components/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  args: {
    onClick: () => {},
    icon: <IconCopy size={16} />,
  },
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {
  args: {
    title: 'Copy',
  },
};

export const WithCopiedFeedback: Story = {
  name: 'With Copied Feedback',
  args: {
    title: 'Copy',
    copiedTitle: 'Copied!',
    copiedIcon: <IconCheck size={16} />,
  },
};

export const WithTooltip: Story = {
  name: 'With Tooltip',
  args: {
    title: 'Copy',
    copiedTitle: 'Copied!',
    copiedIcon: <IconCheck size={16} />,
    tooltip: 'Copied to clipboard',
  },
};

export const WithHoverTooltip: Story = {
  name: 'With Hover Tooltip',
  args: {
    title: 'Copy',
    hoverTooltip: 'Copy to clipboard',
  },
};

export const IconOnly: Story = {
  name: 'Icon Only',
  args: {
    copiedIcon: <IconCheck size={16} />,
  },
};
