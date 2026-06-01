import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  IconCheck,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from '@tabler/icons-react';
import { Alert } from './Alert';
import { AlertType } from '../../constants/alert';

const meta: Meta<typeof Alert> = {
  title: 'UI Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  // CSS `transform` creates a new containing block for `position: fixed` children,
  // confining the alert to this wrapper instead of the viewport.
  decorators: [
    ((Story: Parameters<Decorator>[0]) => (
      <div
        style={{
          transform: 'translateZ(0)',
          height: '120px',
          position: 'relative',
        }}
      >
        <Story />
      </div>
    )) as Decorator,
  ],
  args: {
    infoIcon: <IconInfoCircle size={20} />,
    successIcon: <IconCheck size={20} />,
    errorIcon: <IconX size={20} />,
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    alertDetails: {
      type: AlertType.INFO,
      title: 'Information',
      text: 'This is an informational alert message.',
    },
  },
};

export const InProgress: Story = {
  name: 'In Progress',
  args: {
    alertDetails: {
      type: AlertType.IN_PROGRESS,
      title: 'Loading…',
      text: 'Your request is being processed.',
    },
    infoIcon: <IconLoader2 size={20} />,
  },
};

export const Success: Story = {
  args: {
    alertDetails: {
      type: AlertType.SUCCESS,
      title: 'Success',
      text: 'The operation completed successfully.',
    },
  },
};

export const Error: Story = {
  args: {
    alertDetails: {
      type: AlertType.ERROR,
      title: 'Error',
      text: 'Something went wrong. Please try again.',
    },
  },
};

export const WithoutText: Story = {
  name: 'Without Text',
  args: {
    alertDetails: {
      type: AlertType.INFO,
      title: 'Title Only',
    },
  },
};

export const WithCustomContent: Story = {
  name: 'With Custom Content',
  args: {
    alertDetails: {
      type: AlertType.INFO,
      title: 'Custom Content',
    },
    children: (
      <span className="body-2">
        Custom <strong>rich</strong> content via children.
      </span>
    ),
  },
};

export const WithCloseHandler: Story = {
  name: 'With Close Handler',
  args: {
    alertDetails: {
      type: AlertType.ERROR,
      title: 'Dismissible',
      text: 'Click the × button to close this alert.',
    },
    closeButtonTitle: 'Dismiss',
    onClose: () => {},
  },
};
