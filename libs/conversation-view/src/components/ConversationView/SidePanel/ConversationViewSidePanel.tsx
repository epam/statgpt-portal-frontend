'use client';

import { IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { ReactNode } from 'react';

export function ConversationViewSidePanel({
  title,
  headerExtension,
  onClose,
  bodyClassName,
  panelClassName,
  children,
}: {
  title?: ReactNode;
  headerExtension?: ReactNode;
  onClose: () => void;
  bodyClassName?: string;
  panelClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={classNames(
        'h-full w-[362px] bg-white border-l border-neutrals-500 flex flex-col overflow-hidden',
        panelClassName,
      )}
    >
      <div className="flex justify-between border-b border-neutrals-500 px-5 py-6">
        <div className="h2 text-neutrals-1000">{title}</div>
        <div className="flex gap-2 items-center">
          {headerExtension}
          {headerExtension && <div className="h-3 w-[1px] bg-neutrals-600" />}
          <button type="button" onClick={onClose}>
            <IconX className="size-5 text-neutrals-1000" />
          </button>
        </div>
      </div>
      <div
        className={classNames('flex-1 min-h-0 overflow-hidden', bodyClassName)}
      >
        {children}
      </div>
    </div>
  );
}
