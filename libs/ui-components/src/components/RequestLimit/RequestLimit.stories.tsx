import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  IconAlertTriangle,
  IconEdit,
  IconExternalLink,
} from '@tabler/icons-react';

import { RequestLimitMessage } from './RequestLimit';

const baseLimitMessages = {
  warningIcon: <IconAlertTriangle className="size-4 text-semantic-warning" />,
  largeQuery: 'Large query',
  showingLimit: (limit: number) => `Showing first ${limit} series`,
  downloadMessage: (limit: number) => `Download is limited to ${limit} series`,
  fullLimitMessage: 'Refine your selection to download all data.',
  refineInAdvancedView: 'Refine in Advanced View',
  editIcon: <IconEdit className="size-4" />,
  dataExplorer: 'Open in Data Explorer',
  dataExplorerIcon: <IconExternalLink className="size-4" />,
  containerClassName: 'rounded border-l-2 border-semantic-warning py-2',
  largeQueryClassName: '!text-neutrals-1000 h4 text-xs',
  limitMessageClassName: 'font-normal',
};

const meta: Meta<typeof RequestLimitMessage> = {
  title: 'UI Components/Display/RequestLimitMessage',
  component: RequestLimitMessage,
  tags: ['autodocs'],
  args: {
    limitMessages: baseLimitMessages,
  },
};

export default meta;
type Story = StoryObj<typeof RequestLimitMessage>;

export const Default: Story = {};

export const WithAdvancedViewButton: Story = {
  args: {
    showAdvancedViewButton: true,
  },
};

export const DownloadMode: Story = {
  args: {
    isDownload: true,
  },
};

export const DownloadModeWithQuery: Story = {
  args: {
    isDownload: true,
    query: 'https://example.com/data-explorer?dataset=demo',
  },
};
