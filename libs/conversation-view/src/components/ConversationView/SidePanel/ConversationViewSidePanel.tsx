'use client';

import { IconX } from '@tabler/icons-react';
import { mergeClasses } from '../../../utils/mergeClasses';
import { ReactNode } from 'react';
import { useSidePanelCustomizationConfig } from './SidePanelCustomizationContext';

/**
 * ConversationViewSidePanel renders a fixed-width side panel with a header,
 * a close button, and a scrollable body area.
 *
 * The header displays an optional title on the left and places any
 * `headerExtension` content to the left of the close button, separated by a
 * thin vertical divider when the extension is present.
 *
 * The close button and the panel/header/body classes can be overridden
 * globally via `SidePanelCustomizationProvider`; per-instance props here
 * still take precedence over that provider config.
 *
 * @example
 * Basic side panel with a title
 * ```tsx
 * <ConversationViewSidePanel title="Details" onClose={() => setOpen(false)}>
 *   <p>Panel content goes here.</p>
 * </ConversationViewSidePanel>
 * ```
 *
 * @param title - Optional heading rendered on the left side of the panel header.
 * @param headerExtension - Optional node placed to the left of the close button in the header.
 * @param headerClassName - Additional classes applied to the header row container.
 * @param onClose - Callback invoked when the user clicks the close (X) button.
 * @param bodyClassName - Additional classes applied to the scrollable body container.
 * @param panelClassName - Additional classes applied to the outermost panel wrapper.
 * @param children - Content rendered inside the panel body.
 */
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
  const config = useSidePanelCustomizationConfig();
  const CloseControl = config?.closeControl;

  return (
    <div
      className={mergeClasses(
        'h-full w-[362px] bg-white border-l border-neutrals-500 flex flex-col overflow-hidden',
        config?.classes?.panel,
        panelClassName,
      )}
    >
      <div
        className={mergeClasses(
          'flex justify-between px-5 py-6',
          config?.classes?.header,
          headerClassName,
        )}
      >
        <div className="h2 text-neutrals-1000">{title}</div>
        <div className="flex items-center gap-2">
          {headerExtension}
          {headerExtension && <div className="h-3 w-px bg-neutrals-600" />}
          {CloseControl ? (
            <CloseControl onClose={onClose} />
          ) : (
            <button type="button" onClick={onClose}>
              <IconX className="size-5 text-neutrals-1000" />
            </button>
          )}
        </div>
      </div>
      <div
        className={mergeClasses(
          'flex-1 min-h-0 overflow-hidden',
          config?.classes?.body,
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
