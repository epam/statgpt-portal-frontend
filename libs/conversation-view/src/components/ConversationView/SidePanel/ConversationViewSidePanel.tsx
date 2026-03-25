'use client';

import { IconX } from '@tabler/icons-react';
import { mergeClasses } from '../../../utils/mergeClasses';
import { ReactNode } from 'react';

export function ConversationViewSidePanel({
  title,
  headerExtension,
  headerClassName,
  onClose,
  bodyClassName,
  panelClassName,
  children,
}: {
  title?: ReactNode;
  headerExtension?: ReactNode;
  headerClassName?: string;
  onClose: () => void;
  bodyClassName?: string;
  panelClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={mergeClasses(
        'h-full w-[362px] bg-white border-l border-neutrals-500 flex flex-col overflow-hidden',
        panelClassName,
      )}
    >
      <div
        className={mergeClasses(
          'flex justify-between px-5 py-6',
          headerClassName,
        )}
      >
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
        className={mergeClasses(
          'flex-1 min-h-0 overflow-hidden',
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
