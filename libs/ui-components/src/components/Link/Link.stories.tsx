import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconExternalLink, IconMail } from '@tabler/icons-react';

import { Link } from './Link';

const meta: Meta<typeof Link> = {
  title: 'UI Components/Display/Link',
  component: Link,
  tags: ['autodocs'],
  args: {
    url: 'https://example.com',
    title: 'Example link',
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {};

export const WithIconAfter: Story = {
  args: {
    iconAfter: <IconExternalLink size={14} />,
    linkClassName: 'inline-flex items-center',
  },
};

export const WithIconBefore: Story = {
  args: {
    iconBefore: <IconMail size={14} />,
    title: 'Contact us',
    url: 'mailto:hello@example.com',
    linkClassName: 'inline-flex items-center',
  },
};

export const WithBothIcons: Story = {
  args: {
    iconBefore: <IconMail size={14} />,
    iconAfter: <IconExternalLink size={14} />,
    linkClassName: 'inline-flex items-center',
  },
};
