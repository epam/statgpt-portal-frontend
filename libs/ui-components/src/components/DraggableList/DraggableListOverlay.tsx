import { IconChevronRight, IconGripVertical } from '@tabler/icons-react';
import classNames from 'classnames';
import { Checkbox } from '../Checkbox/Checkbox';

export function DraggableListOverlay({
  label,
  hasChildren,
  showDragHandle,
  showCheckbox,
  isChecked,
  isExpanded,
}: {
  label: string;
  hasChildren: boolean;
  showDragHandle: boolean;
  showCheckbox: boolean;
  isChecked?: boolean;
  isExpanded?: boolean;
}) {
  return (
    <div className="rounded bg-neutral-200 shadow cursor-grabbing relative">
      <div className="absolute -left-[0.5px] top-0.5 w-0.5 h-5 rounded-full bg-gradients-light" />
      <div className="flex items-stretch overflow-hidden rounded">
        {showDragHandle ? (
          <div className="flex w-6 items-center justify-center">
            <span aria-hidden className="rounded p-1">
              <IconGripVertical size={16} />
            </span>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 items-center gap-2 p-1">
          {showCheckbox ? (
            <Checkbox
              id={`draggable-list-${label}`}
              checked={!!isChecked}
              className="p-0"
            />
          ) : null}
          <span className="truncate body-3">{label}</span>
        </div>

        {hasChildren ? (
          <div className="flex w-8 items-center justify-center">
            <span
              aria-hidden
              className={classNames(
                'transition-transform',
                isExpanded ? 'rotate-90' : 'rotate-0',
              )}
            >
              <IconChevronRight size={16} />
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
