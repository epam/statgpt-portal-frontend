import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { InlineAlert } from './InlineAlert';
import { InlineAlertType } from './types';

const meta: Meta<typeof InlineAlert> = {
  title: 'UI Components/InlineAlert',
  component: InlineAlert,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InlineAlert>;

export const InfoStory: Story = {
  name: 'Info',
  args: {
    type: InlineAlertType.Info,
    children: 'Informational message for the user.',
  },
};

export const ErrorStory: Story = {
  name: 'Error',
  args: {
    type: InlineAlertType.Error,
    children: 'Something went wrong. Please try again.',
  },
};

export const WarningStory: Story = {
  name: 'Warning',
  args: {
    type: InlineAlertType.Warning,
    children: 'Please review this warning before continuing.',
  },
};

export const NoteStory: Story = {
  name: 'Note',
  args: {
    type: InlineAlertType.Note,
    children: 'A helpful note for the user.',
  },
};

export const WithIcon: Story = {
  name: 'With Icon',
  args: {
    type: InlineAlertType.Info,
    icon: <IconInfoCircle size={16} />,
    children: 'Info message with an icon.',
  },
};
