import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconExternalLink } from '@tabler/icons-react';
import React from 'react';
import { DownloadFormatMessage } from './DownloadFormatMessage';

const meta: Meta<typeof DownloadFormatMessage> = {
  title: 'UI Components/Display/DownloadFormatMessage',
  component: DownloadFormatMessage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DownloadFormatMessage>;

export const Default: Story = {
  args: {
    limitMessages: {
      excelFormatTitle: 'Excel format only.',
      excelFormatText: 'The download is limited to 1 000 series.',
      dataExplorer: 'Open in Data Explorer',
      dataExplorerIcon: <IconExternalLink size={16} />,
    },
    query: 'https://example.com/data-explorer',
  },
};

export const WithoutLink: Story = {
  name: 'Without Link',
  args: {
    limitMessages: {
      excelFormatTitle: 'Excel format only.',
      excelFormatText: 'The download is limited to 1 000 series.',
    },
  },
};

export const TitleOnly: Story = {
  name: 'Title Only',
  args: {
    limitMessages: {
      excelFormatTitle: 'Excel format only.',
    },
  },
};

export const Empty: Story = {
  args: {
    limitMessages: {},
  },
};
