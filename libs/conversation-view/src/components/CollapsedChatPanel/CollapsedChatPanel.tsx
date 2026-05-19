import { FC, ReactNode } from 'react';

interface Props {
  conversationName: string | undefined;
  expandTitle: string;
  expandIcon: ReactNode;
  onExpand: () => void;
}

/**
 * CollapsedChatPanel renders the collapsed state of the chat panel
 * when advanced view is open, showing an expand button and the conversation
 * title rotated vertically.
 *
 * @example
 * Basic usage
 * ```tsx
 * <CollapsedChatPanel
 *   conversationName="Q3 Revenue Analysis"
 *   expandTitle="Expand"
 *   expandIcon={<ExpandIcon width={20} height={20} />}
 *   onExpand={() => setCollapsed(false)}
 * />
 * ```
 *
 * @param conversationName - Title displayed vertically; renders empty when undefined.
 * @param expandTitle - Accessible label and tooltip for the expand button.
 * @param expandIcon - Icon element rendered inside the expand button.
 * @param onExpand - Called when the user clicks the expand button.
 */
export const CollapsedChatPanel: FC<Props> = ({
  conversationName,
  expandTitle,
  expandIcon,
  onExpand,
}) => {
  return (
    <div className="border-neutrals-400 flex h-full w-[51px] shrink-0 flex-col items-center border bg-white">
      <button
        type="button"
        className="text-primary mt-[84px] flex size-9 items-center justify-center"
        aria-label={expandTitle}
        title={expandTitle}
        onClick={onExpand}
      >
        {expandIcon}
      </button>
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden pb-[88px] pt-[72px]">
        <span
          className="h3 min-h-0 flex-1 text-neutrals-1000 text-center [writing-mode:vertical-rl] rotate-180 truncate"
          title={conversationName}
        >
          {conversationName}
        </span>
      </div>
    </div>
  );
};
