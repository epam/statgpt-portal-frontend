import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';

import { DraggableList } from '../DraggableList';
import type {
  DraggableListItemNode,
  DraggableListNode,
  ToggleCheckedEvent,
  ToggleExpandedEvent,
} from '../types';

function setItemProps(
  nodes: DraggableListNode[],
  path: readonly string[],
  patch: Partial<DraggableListItemNode>,
): DraggableListNode[] {
  if (!path.length) return nodes;
  const [head, ...tail] = path;
  return nodes.map((node) => {
    if (node.id !== head) return node;
    if (!tail.length && node.type === 'item') return { ...node, ...patch };
    if (node.items)
      return { ...node, items: setItemProps(node.items, tail, patch) };
    return node;
  });
}

function Controlled({
  initialItems,
  ...props
}: { initialItems: DraggableListNode[] } & Omit<
  React.ComponentProps<typeof DraggableList>,
  'items' | 'onItemsChange'
>) {
  const [items, setItems] = useState(initialItems);

  const handleToggleExpanded = ({ path, nextExpanded }: ToggleExpandedEvent) =>
    setItems((prev) => setItemProps(prev, path, { isExpanded: nextExpanded }));

  const handleToggleChecked = ({ path, nextChecked }: ToggleCheckedEvent) =>
    setItems((prev) => setItemProps(prev, path, { isChecked: nextChecked }));

  return (
    <DraggableList
      {...props}
      items={items}
      onItemsChange={(next) => setItems(next)}
      onToggleExpanded={handleToggleExpanded}
      onToggleChecked={handleToggleChecked}
    />
  );
}

const meta: Meta<typeof DraggableList> = {
  title: 'UI Components/Data/DraggableList',
  component: DraggableList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      story: { inline: false, height: '220px' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DraggableList>;

const flatItems: DraggableListNode[] = [
  { type: 'item', id: 'agency', label: 'Agency', isChecked: true },
  { type: 'item', id: 'freq', label: 'Frequency', isChecked: true },
  { type: 'item', id: 'indicator', label: 'Indicator', isChecked: false },
  { type: 'item', id: 'scale', label: 'Scale', isChecked: false },
];

export const Default: Story = {
  render: () => <Controlled initialItems={flatItems} />,
};

export const WithGroups: Story = {
  name: 'With Groups',
  render: () => (
    <Controlled
      initialItems={[
        {
          type: 'group',
          id: 'time',
          label: 'Time dimensions',
          items: [
            { type: 'item', id: 'period', label: 'Period', isChecked: true },
            { type: 'item', id: 'year', label: 'Year', isChecked: false },
          ],
        },
        {
          type: 'group',
          id: 'indicator-group',
          label: 'Indicator dimensions',
          items: [
            {
              type: 'item',
              id: 'indicator',
              label: 'Indicator',
              isChecked: true,
            },
            { type: 'item', id: 'scale', label: 'Scale', isChecked: false },
          ],
        },
      ]}
    />
  ),
};

export const WithNestedItems: Story = {
  name: 'With Nested Items',
  render: () => (
    <Controlled
      initialItems={[
        {
          type: 'item',
          id: 'agency',
          label: 'Agency',
          isChecked: true,
          isExpanded: true,
          items: [
            {
              type: 'item',
              id: 'sub-a',
              label: 'Sub-agency A',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'sub-b',
              label: 'Sub-agency B',
              isChecked: false,
            },
          ],
        },
        { type: 'item', id: 'freq', label: 'Frequency', isChecked: true },
        { type: 'item', id: 'indicator', label: 'Indicator', isChecked: false },
      ]}
    />
  ),
};

export const WithoutCheckbox: Story = {
  name: 'Without Checkbox',
  render: () => <Controlled initialItems={flatItems} showCheckbox={false} />,
};

export const WithoutDragHandle: Story = {
  name: 'Without Drag Handle',
  render: () => <Controlled initialItems={flatItems} showDragHandle={false} />,
};

export const WithDisabledItems: Story = {
  name: 'With Disabled Items',
  render: () => (
    <Controlled
      initialItems={[
        { type: 'item', id: 'agency', label: 'Agency', isChecked: true },
        {
          type: 'item',
          id: 'freq',
          label: 'Frequency',
          isChecked: true,
          isDisabled: true,
        },
        {
          type: 'item',
          id: 'indicator',
          label: 'Indicator',
          isChecked: false,
          isDisabled: true,
        },
        { type: 'item', id: 'scale', label: 'Scale', isChecked: false },
      ]}
    />
  ),
};
