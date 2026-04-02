import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DraggableListRow } from '../DraggableListRow';
import type { DraggableListItemNode } from '../types';

const mockUseSortable = jest.fn();

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: (...args: unknown[]) => mockUseSortable(...args),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => undefined),
    },
  },
}));

describe('DraggableListRow', () => {
  const baseItem: DraggableListItemNode = {
    type: 'item',
    id: 'dataset',
    label: 'Dataset',
    isChecked: true,
  };

  beforeEach(() => {
    mockUseSortable.mockReturnValue({
      attributes: { 'data-sortable': 'true' },
      listeners: { onPointerDown: jest.fn() },
      setNodeRef: jest.fn(),
      setActivatorNodeRef: jest.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders item label', () => {
    render(
      <DraggableListRow
        parentPath={[]}
        item={baseItem}
        showDragHandle
        showCheckbox
      />,
    );

    expect(screen.getByText('Dataset')).toBeTruthy();
  });

  it('renders custom label from renderLabel', () => {
    render(
      <DraggableListRow
        parentPath={[]}
        item={baseItem}
        showDragHandle
        showCheckbox
        renderLabel={(item) => <span>Custom: {item.label}</span>}
      />,
    );

    expect(screen.getByText('Custom: Dataset')).toBeTruthy();
    expect(screen.queryByText('Dataset')).toBeNull();
  });

  it('calls useSortable with computed id and draggable state', () => {
    render(
      <DraggableListRow
        parentPath={['group-1']}
        item={baseItem}
        showDragHandle
        showCheckbox
      />,
    );

    expect(mockUseSortable).toHaveBeenCalledWith({
      id: 'i:group-1/dataset',
      disabled: false,
    });
  });

  it('passes disabled=true to useSortable when item is not draggable', () => {
    render(
      <DraggableListRow
        parentPath={[]}
        item={{ ...baseItem, draggable: false }}
        showDragHandle
        showCheckbox
      />,
    );

    expect(mockUseSortable).toHaveBeenCalledWith({
      id: 'i:dataset',
      disabled: true,
    });
  });

  it('renders drag handle when showDragHandle is true', () => {
    const { container } = render(
      <DraggableListRow
        parentPath={[]}
        item={baseItem}
        showDragHandle
        showCheckbox={false}
      />,
    );

    expect(container.querySelector('[data-sortable="true"]')).toBeTruthy();
  });

  it('does not render drag handle when showDragHandle is false', () => {
    const { container } = render(
      <DraggableListRow
        parentPath={[]}
        item={baseItem}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    expect(container.querySelector('[data-sortable="true"]')).toBeNull();
  });

  it('renders checkbox when showCheckbox is true', () => {
    render(
      <DraggableListRow
        parentPath={[]}
        item={baseItem}
        showDragHandle={false}
        showCheckbox
      />,
    );

    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('does not render checkbox when showCheckbox is false', () => {
    render(
      <DraggableListRow
        parentPath={[]}
        item={baseItem}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('calls onItemClick with item id and path', () => {
    const onItemClick = jest.fn();

    render(
      <DraggableListRow
        parentPath={['group-1']}
        item={baseItem}
        showDragHandle={false}
        showCheckbox={false}
        onItemClick={onItemClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dataset' }));

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick.mock.calls[0][0]).toMatchObject({
      itemId: 'dataset',
      path: ['group-1', 'dataset'],
    });
  });

  it('calls onToggleChecked when checkbox changes', () => {
    const onToggleChecked = jest.fn();

    render(
      <DraggableListRow
        parentPath={['group-1']}
        item={{ ...baseItem, isChecked: false }}
        showDragHandle={false}
        showCheckbox
        onToggleChecked={onToggleChecked}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onToggleChecked).toHaveBeenCalledTimes(1);
    expect(onToggleChecked).toHaveBeenCalledWith({
      itemId: 'dataset',
      path: ['group-1', 'dataset'],
      nextChecked: true,
    });
  });

  it('renders chevron button when item has children', () => {
    render(
      <DraggableListRow
        parentPath={[]}
        item={{
          ...baseItem,
          items: [
            {
              type: 'item',
              id: 'child',
              label: 'Child',
            },
          ],
        }}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    expect(screen.getByLabelText('Expand')).toBeTruthy();
  });

  it('does not render chevron button when item has no children', () => {
    render(
      <DraggableListRow
        parentPath={[]}
        item={baseItem}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    expect(screen.queryByLabelText('Expand')).toBeNull();
    expect(screen.queryByLabelText('Collapse')).toBeNull();
  });

  it('calls onToggleExpanded with nextExpanded=true when collapsed item is clicked', () => {
    const onToggleExpanded = jest.fn();

    render(
      <DraggableListRow
        parentPath={['group-1']}
        item={{
          ...baseItem,
          isExpanded: false,
          items: [
            {
              type: 'item',
              id: 'child',
              label: 'Child',
            },
          ],
        }}
        showDragHandle={false}
        showCheckbox={false}
        onToggleExpanded={onToggleExpanded}
      />,
    );

    fireEvent.click(screen.getByLabelText('Expand'));

    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
    expect(onToggleExpanded).toHaveBeenCalledWith({
      itemId: 'dataset',
      path: ['group-1', 'dataset'],
      nextExpanded: true,
    });
  });

  it('calls onToggleExpanded with nextExpanded=false when expanded item is clicked', () => {
    const onToggleExpanded = jest.fn();

    render(
      <DraggableListRow
        parentPath={['group-1']}
        item={{
          ...baseItem,
          isExpanded: true,
          items: [
            {
              type: 'item',
              id: 'child',
              label: 'Child',
            },
          ],
        }}
        showDragHandle={false}
        showCheckbox={false}
        onToggleExpanded={onToggleExpanded}
      />,
    );

    fireEvent.click(screen.getByLabelText('Collapse'));

    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
    expect(onToggleExpanded).toHaveBeenCalledWith({
      itemId: 'dataset',
      path: ['group-1', 'dataset'],
      nextExpanded: false,
    });
  });

  it('applies rotate-90 class when item is expanded', () => {
    const { container } = render(
      <DraggableListRow
        parentPath={[]}
        item={{
          ...baseItem,
          isExpanded: true,
          items: [
            {
              type: 'item',
              id: 'child',
              label: 'Child',
            },
          ],
        }}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    const chevronWrapper = container.querySelector(
      '.transition-transform',
    ) as HTMLElement;

    expect(chevronWrapper).toBeTruthy();
    expect(chevronWrapper.className).toContain('rotate-90');
  });

  it('applies rotate-0 class when item is collapsed', () => {
    const { container } = render(
      <DraggableListRow
        parentPath={[]}
        item={{
          ...baseItem,
          isExpanded: false,
          items: [
            {
              type: 'item',
              id: 'child',
              label: 'Child',
            },
          ],
        }}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    const chevronWrapper = container.querySelector(
      '.transition-transform',
    ) as HTMLElement;

    expect(chevronWrapper).toBeTruthy();
    expect(chevronWrapper.className).toContain('rotate-0');
  });

  it('applies disabled styling and disables interactive controls when item is disabled', () => {
    const { container } = render(
      <DraggableListRow
        parentPath={[]}
        item={{
          ...baseItem,
          isDisabled: true,
          items: [
            {
              type: 'item',
              id: 'child',
              label: 'Child',
            },
          ],
        }}
        showDragHandle
        showCheckbox
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('opacity-50');

    const rowButton = screen.getByRole('button', {
      name: 'Dataset',
    }) as HTMLButtonElement;
    expect(rowButton.disabled).toBe(true);
    expect(rowButton.className).not.toContain('hover:bg-neutrals-100');
    expect(rowButton.className).not.toContain('hover:text-blue-700');

    const expandButton = screen.getByLabelText('Expand') as HTMLButtonElement;
    expect(expandButton.disabled).toBe(true);

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });

  it('disables row body clicks when item is not checkable', () => {
    const onItemClick = jest.fn();

    render(
      <DraggableListRow
        parentPath={['group-1']}
        item={{
          ...baseItem,
          checkable: false,
        }}
        showDragHandle={false}
        showCheckbox
        onItemClick={onItemClick}
      />,
    );

    const rowButton = screen.getByRole('button', {
      name: 'Dataset',
    }) as HTMLButtonElement;
    expect(rowButton.disabled).toBe(false);
    expect(rowButton.getAttribute('aria-disabled')).toBe('true');
    expect(rowButton.className).toContain('hover:bg-neutrals-100');
    expect(rowButton.className).toContain('hover:text-blue-700');

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);

    fireEvent.click(rowButton);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('applies dragging opacity when isDragging is true', () => {
    mockUseSortable.mockReturnValueOnce({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      setActivatorNodeRef: jest.fn(),
      transform: null,
      transition: undefined,
      isDragging: true,
    });

    const { container } = render(
      <DraggableListRow
        parentPath={[]}
        item={baseItem}
        showDragHandle
        showCheckbox={false}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.opacity).toBe('0.6');
  });
});
