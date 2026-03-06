import { CSSProperties, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconChevronRight, IconGripVertical } from '@tabler/icons-react';
import classNames from 'classnames';

import type {
  DraggableListItemNode,
  ItemClickEvent,
  ToggleCheckedEvent,
  ToggleExpandedEvent,
} from './types';
import { itemKey } from './utils';
import { Checkbox } from '../Checkbox/Checkbox';

export function DraggableListRow({
  parentPath,
  item,
  showDragHandle,
  showCheckbox,
  renderLabel,
  onItemClick,
  onToggleExpanded,
  onToggleChecked,
}: {
  parentPath: string[];
  item: DraggableListItemNode;

  showDragHandle: boolean;
  showCheckbox: boolean;

  renderLabel?: (item: DraggableListItemNode) => ReactNode;

  onItemClick?: (e: ItemClickEvent) => void;
  onToggleExpanded?: (e: ToggleExpandedEvent) => void;
  onToggleChecked?: (e: ToggleCheckedEvent) => void;
}) {
  const hasChildren = !!item.items?.length;
  const isExpanded = !!item.isExpanded;

  const draggable = item.isDisabled ? false : (item.draggable ?? true);
  const checkable = item.isDisabled ? false : (item.checkable ?? true);

  const id = itemKey(parentPath, item.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !draggable });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  const disabled = !!item.isDisabled;
  const path = [...parentPath, item.id];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames([
        'group flex items-stretch overflow-hidden rounded bg-white',
        'select-none',
        disabled ? 'opacity-50' : '',
      ])}
    >
      {showDragHandle ? (
        <div
          className={classNames([
            'group/drag-handle flex w-6 items-center justify-center rounded',
            disabled ? '' : 'hover:bg-neutral-100 cursor-grab',
          ])}
        >
          <span
            ref={setActivatorNodeRef}
            aria-hidden
            className={classNames([
              'rounded p-1',
              draggable ? 'cursor-grab' : 'cursor-default',
              'transition-opacity',
            ])}
            {...(draggable ? listeners : {})}
            {...(draggable ? attributes : {})}
          >
            <IconGripVertical
              size={16}
              className="text-neutral-800 group-hover/drag-handle:text-primary"
            />
          </span>
        </div>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={(e) =>
          onItemClick?.({
            itemId: item.id,
            path,
            nativeEvent: e,
          })
        }
        className={classNames([
          'flex min-w-0 flex-1 items-center gap-2 p-1 text-left rounded',
          disabled ? '' : 'hover:bg-neutral-100',
          disabled ? '' : 'hover:text-blue-700',
          'focus:outline-none',
        ])}
      >
        {showCheckbox ? (
          <Checkbox
            id={`draggable-list-${path.join('-')}`}
            checked={!!item.isChecked}
            disabled={!checkable}
            className="p-0"
            stopPropagation
            onChange={(_, nextChecked) =>
              onToggleChecked?.({
                itemId: item.id,
                path,
                nextChecked: !!nextChecked,
              })
            }
          />
        ) : null}

        <span className="truncate body-3 text-neutral-800">
          {renderLabel ? renderLabel(item) : item.label}
        </span>
      </button>

      {hasChildren ? (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpanded?.({
              itemId: item.id,
              path,
              nextExpanded: !isExpanded,
            });
          }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          className={classNames([
            'flex w-8 items-center justify-center rounded',
            disabled ? '' : 'hover:bg-neutral-100',
            'focus:outline-none',
          ])}
        >
          <span
            aria-hidden
            className={classNames(
              'transition-transform duration-150 ease-out',
              isExpanded ? 'rotate-90' : 'rotate-0',
            )}
          >
            <IconChevronRight size={16} />
          </span>
        </button>
      ) : null}
    </div>
  );
}
