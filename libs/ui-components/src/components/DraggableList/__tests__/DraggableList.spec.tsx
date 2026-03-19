import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useSensor, useSensors } from '@dnd-kit/core';
import { DraggableList } from '../DraggableList';
import type { DraggableListItemNode, DraggableListNode } from '../types';

let mockDndContextProps: Record<string, unknown> = {};

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => {
    mockDndContextProps = props;
    return <div data-testid="dnd-context">{children}</div>;
  },
  DragOverlay: ({ children }: React.PropsWithChildren) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  PointerSensor: 'PointerSensor',
  closestCenter: jest.fn(),
  useSensor: jest.fn(() => ({ sensor: true })),
  useSensors: jest.fn((...args) => args),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: React.PropsWithChildren) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  verticalListSortingStrategy: jest.fn(),
  arrayMove: <T,>(array: T[], from: number, to: number): T[] => {
    const next = [...array];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  },
}));

const mockUseSensor = useSensor as jest.Mock;
const mockUseSensors = useSensors as jest.Mock;

const mockRow = jest.fn();
jest.mock('../DraggableListRow', () => ({
  DraggableListRow: (props: {
    item: DraggableListItemNode;
    renderLabel?: (item: DraggableListItemNode) => React.ReactNode;
  }) => {
    mockRow(props);

    return (
      <div data-testid={`row-${props.item.id}`}>
        {props.renderLabel ? props.renderLabel(props.item) : props.item.label}
      </div>
    );
  },
}));

const mockOverlay = jest.fn();
jest.mock('../DraggableListOverlay', () => ({
  DraggableListOverlay: (props: {
    label: string;
    hasChildren: boolean;
    isChecked?: boolean;
    isExpanded?: boolean;
  }) => {
    mockOverlay(props);

    return (
      <div data-testid="draggable-list-overlay">
        {props.label}
        {props.hasChildren ? ' | children' : ''}
        {props.isChecked ? ' | checked' : ''}
        {props.isExpanded ? ' | expanded' : ''}
      </div>
    );
  },
}));

describe('DraggableList', () => {
  const items: DraggableListNode[] = [
    {
      type: 'item',
      id: 'agency',
      label: 'Agency',
      isChecked: true,
    },
    {
      type: 'group',
      id: 'indicator-group',
      label: 'Indicator dimensions',
      items: [
        {
          type: 'item',
          id: 'weo',
          label: 'World Economic Outlook (WEO)',
          isExpanded: true,
          items: [
            {
              type: 'item',
              id: 'indicator',
              label: 'Indicator',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'scale',
              label: 'Scale',
              isChecked: false,
            },
          ],
        },
        {
          type: 'item',
          id: 'imf',
          label: 'IMF',
          isChecked: false,
        },
      ],
    },
  ];

  beforeEach(() => {
    mockDndContextProps = {};
    mockUseSensor.mockClear();
    mockUseSensors.mockClear();
    mockRow.mockClear();
    mockOverlay.mockClear();
  });

  it('renders root item rows and group label', () => {
    render(<DraggableList items={items} onItemsChange={jest.fn()} />);

    expect(screen.getByTestId('row-agency')).toBeTruthy();
    expect(screen.getByText('Indicator dimensions')).toBeTruthy();
    expect(screen.getByTestId('row-weo')).toBeTruthy();
    expect(screen.getByTestId('row-imf')).toBeTruthy();
    expect(screen.getByTestId('row-indicator')).toBeTruthy();
    expect(screen.getByTestId('row-scale')).toBeTruthy();
  });

  it('does not render nested children when item is collapsed', () => {
    const collapsedItems: DraggableListNode[] = [
      {
        type: 'item',
        id: 'dataset',
        label: 'Dataset',
        isExpanded: false,
        items: [
          {
            type: 'item',
            id: 'child',
            label: 'Child',
          },
        ],
      },
    ];

    render(<DraggableList items={collapsedItems} onItemsChange={jest.fn()} />);

    expect(screen.getByTestId('row-dataset')).toBeTruthy();
    expect(screen.queryByTestId('row-child')).toBeNull();
  });

  it('passes showDragHandle and showCheckbox props to rows', () => {
    render(
      <DraggableList
        items={items}
        onItemsChange={jest.fn()}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    expect(mockRow).toHaveBeenCalled();
    const firstCallProps = mockRow.mock.calls[0][0];

    expect(firstCallProps.showDragHandle).toBe(false);
    expect(firstCallProps.showCheckbox).toBe(false);
  });

  it('passes renderLabel to rows', () => {
    render(
      <DraggableList
        items={items}
        onItemsChange={jest.fn()}
        renderLabel={(item) => <span>Custom: {item.label}</span>}
      />,
    );

    expect(screen.getByText('Custom: Agency')).toBeTruthy();
    expect(
      screen.getByText('Custom: World Economic Outlook (WEO)'),
    ).toBeTruthy();
  });

  it('initializes dnd sensors', () => {
    render(<DraggableList items={items} onItemsChange={jest.fn()} />);

    expect(mockUseSensor).toHaveBeenCalledWith('PointerSensor', {
      activationConstraint: { distance: 6 },
    });
    expect(mockUseSensors).toHaveBeenCalled();
  });

  it('renders overlay after drag start for valid item', () => {
    render(<DraggableList items={items} onItemsChange={jest.fn()} />);

    const onDragStart = mockDndContextProps.onDragStart as (e: unknown) => void;

    act(() => {
      onDragStart({
        active: {
          id: 'i:indicator-group/weo',
        },
      });
    });

    expect(screen.getByTestId('draggable-list-overlay')).toBeTruthy();
  });

  it('does not render overlay after drag start for invalid key', () => {
    render(<DraggableList items={items} onItemsChange={jest.fn()} />);

    const onDragStart = mockDndContextProps.onDragStart as (e: unknown) => void;

    onDragStart({
      active: {
        id: 'invalid-key',
      },
    });

    expect(screen.queryByTestId('draggable-list-overlay')).toBeNull();
  });

  it('calls onItemsChange when root sibling items are reordered', () => {
    const reorderItems: DraggableListNode[] = [
      {
        type: 'item',
        id: 'agency',
        label: 'Agency',
      },
      {
        type: 'item',
        id: 'dataset',
        label: 'Dataset',
      },
    ];

    const onItemsChange = jest.fn();

    render(
      <DraggableList items={reorderItems} onItemsChange={onItemsChange} />,
    );

    const onDragEnd = mockDndContextProps.onDragEnd as (e: unknown) => void;

    onDragEnd({
      active: { id: 'i:agency' },
      over: { id: 'i:dataset' },
    });

    expect(onItemsChange).toHaveBeenCalledTimes(1);
    expect(onItemsChange).toHaveBeenCalledWith([
      {
        type: 'item',
        id: 'dataset',
        label: 'Dataset',
      },
      {
        type: 'item',
        id: 'agency',
        label: 'Agency',
      },
    ]);
  });

  it('calls onItemsChange when nested sibling items are reordered', () => {
    const onItemsChange = jest.fn();

    render(<DraggableList items={items} onItemsChange={onItemsChange} />);

    const onDragEnd = mockDndContextProps.onDragEnd as (e: unknown) => void;

    onDragEnd({
      active: { id: 'i:indicator-group/weo/indicator' },
      over: { id: 'i:indicator-group/weo/scale' },
    });

    expect(onItemsChange).toHaveBeenCalledTimes(1);

    const nextItems = onItemsChange.mock.calls[0][0] as DraggableListNode[];
    const group = nextItems.find((node) => node.id === 'indicator-group');
    expect(group && group.type === 'group').toBe(true);

    if (group?.type === 'group') {
      const weo = group.items.find((node) => node.id === 'weo');
      expect(weo && weo.type === 'item').toBe(true);

      if (weo?.type === 'item') {
        expect(weo.items?.map((node) => node.id)).toEqual([
          'scale',
          'indicator',
        ]);
      }
    }
  });

  it('does not call onItemsChange when dropped outside', () => {
    const onItemsChange = jest.fn();

    render(<DraggableList items={items} onItemsChange={onItemsChange} />);

    const onDragEnd = mockDndContextProps.onDragEnd as (e: unknown) => void;

    onDragEnd({
      active: { id: 'i:agency' },
      over: null,
    });

    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it('does not call onItemsChange when parent paths differ', () => {
    const onItemsChange = jest.fn();

    render(<DraggableList items={items} onItemsChange={onItemsChange} />);

    const onDragEnd = mockDndContextProps.onDragEnd as (e: unknown) => void;

    onDragEnd({
      active: { id: 'i:agency' },
      over: { id: 'i:indicator-group/weo' },
    });

    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it('does not call onItemsChange when old and new indices are equal', () => {
    const onItemsChange = jest.fn();

    render(<DraggableList items={items} onItemsChange={onItemsChange} />);

    const onDragEnd = mockDndContextProps.onDragEnd as (e: unknown) => void;

    onDragEnd({
      active: { id: 'i:agency' },
      over: { id: 'i:agency' },
    });

    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it('clears overlay after drag end', () => {
    render(<DraggableList items={items} onItemsChange={jest.fn()} />);

    const onDragStart = mockDndContextProps.onDragStart as (e: unknown) => void;
    const onDragEnd = mockDndContextProps.onDragEnd as (e: unknown) => void;

    act(() => {
      onDragStart({
        active: {
          id: 'i:indicator-group/weo',
        },
      });
    });

    expect(screen.getByTestId('draggable-list-overlay')).toBeTruthy();

    act(() => {
      onDragEnd({
        active: { id: 'i:indicator-group/weo' },
        over: null,
      });
    });

    expect(screen.queryByTestId('draggable-list-overlay')).toBeNull();
  });
});
