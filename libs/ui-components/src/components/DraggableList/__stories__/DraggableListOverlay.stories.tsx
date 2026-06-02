import type { Meta, StoryObj } from '@storybook/react-vite';

import { DraggableListOverlay } from '../DraggableListOverlay';

const meta: Meta<typeof DraggableListOverlay> = {
  title: 'UI Components/Data/DraggableList/Overlay',
  component: DraggableListOverlay,
  tags: ['autodocs'],
  args: {
    id: 'overlay-item',
    label: 'Agency',
    hasChildren: false,
    showDragHandle: true,
    showCheckbox: true,
  },
};

export default meta;
type Story = StoryObj<typeof DraggableListOverlay>;

export const Default: Story = {};

export const Checked: Story = {
  args: { isChecked: true },
};

export const WithChildren: Story = {
  name: 'With Children',
  args: { hasChildren: true },
};

export const Expanded: Story = {
  args: { hasChildren: true, isExpanded: true },
};

export const WithoutDragHandle: Story = {
  name: 'Without Drag Handle',
  args: { showDragHandle: false },
};

export const WithoutCheckbox: Story = {
  name: 'Without Checkbox',
  args: { showCheckbox: false },
};
