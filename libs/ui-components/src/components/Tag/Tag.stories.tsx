import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'UI Components/Display/Tag',
  component: Tag,
  tags: ['autodocs'],
  args: {
    title: 'Technology',
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithTextCallback: Story = {
  name: 'With Separate Click Text',
  args: {
    title: 'Show label',
    text: 'machine-key',
  },
};
