import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { DndContext } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { DraggableListRow } from '../DraggableListRow';
import type { DraggableListItemNode } from '../types';
import { itemKey } from '../utils/utils';

const baseItem: DraggableListItemNode = {
  type: 'item',
  id: 'row-item',
  label: 'Agency',
};

const SORT_ID = itemKey([], baseItem.id);

const meta: Meta<typeof DraggableListRow> = {
  title: 'UI Components/Data/DraggableList/Row',
  component: DraggableListRow,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <DndContext>
        <SortableContext
          items={[SORT_ID]}
          strategy={verticalListSortingStrategy}
        >
          <Story />
        </SortableContext>
      </DndContext>
    ),
  ],
  args: {
    parentPath: [],
    item: baseItem,
    showDragHandle: true,
    showCheckbox: true,
  },
};

export default meta;
type Story = StoryObj<typeof DraggableListRow>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    item: { ...baseItem, isChecked: true },
  },
};

export const WithChildren: Story = {
  name: 'With Children',
  args: {
    item: {
      ...baseItem,
      items: [{ type: 'item', id: 'child', label: 'Child Item' }],
    },
  },
};

export const Expanded: Story = {
  args: {
    item: {
      ...baseItem,
      isExpanded: true,
      items: [{ type: 'item', id: 'child', label: 'Child Item' }],
    },
  },
};

export const Disabled: Story = {
  args: {
    item: { ...baseItem, isDisabled: true },
  },
};

export const WithoutDragHandle: Story = {
  name: 'Without Drag Handle',
  args: {
    showDragHandle: false,
  },
};

export const WithoutCheckbox: Story = {
  name: 'Without Checkbox',
  args: {
    showCheckbox: false,
  },
};
