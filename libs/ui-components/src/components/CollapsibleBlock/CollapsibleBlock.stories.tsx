import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { IconFilter } from '@tabler/icons-react';
import { CollapsibleBlock } from './CollapsibleBlock';

const meta: Meta<typeof CollapsibleBlock> = {
  title: 'UI Components/CollapsibleBlock',
  component: CollapsibleBlock,
  tags: ['autodocs'],
  args: {
    title: 'Section Title',
    children: <p className="body-2 text-neutrals-800">Collapsible content goes here.</p>,
  },
};

export default meta;
type Story = StoryObj<typeof CollapsibleBlock>;

export const Default: Story = {};

export const WithValue: Story = {
  name: 'With Value',
  args: {
    value: '3 selected',
  },
};

export const WithCustomIcon: Story = {
  name: 'With Custom Icon',
  args: {
    icon: <IconFilter className="mr-3 size-5" />,
  },
};

export const WithRichContent: Story = {
  name: 'With Rich Content',
  args: {
    title: 'Filters',
    value: '2 active',
    children: (
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 body-2">
          <input type="checkbox" /> Option A
        </label>
        <label className="flex items-center gap-2 body-2">
          <input type="checkbox" defaultChecked /> Option B
        </label>
        <label className="flex items-center gap-2 body-2">
          <input type="checkbox" /> Option C
        </label>
      </div>
    ),
  },
};
