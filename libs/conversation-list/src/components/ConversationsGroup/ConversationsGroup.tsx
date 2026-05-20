/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { ConversationInfo } from '@epam/ai-dial-shared';
import { FC, useCallback, useState } from 'react';
import classNames from 'classnames';
import {
  getLabelByGroup,
  sortConversationsByUpdatedAt,
} from '../../utils/conversations-grouping';
import ConversationItem from '../ConversationItem/ConversationItem';
import { IconCaretRightFilled } from '@tabler/icons-react';
import { useConversationStyles } from '../../context/ConversationStylesContext';

interface Props {
  groupLabel: string;
  groupedConversations: ConversationInfo[];
  selectedConversationId?: string;
  isDisabled?: boolean;
  handleConversationClick: (folder: string, conversationId: string) => void;
}

const ConversationsGroup: FC<Props> = ({
  handleConversationClick,
  selectedConversationId,
  groupLabel,
  groupedConversations,
  isDisabled,
}) => {
  const { titles } = useConversationStyles();
  const [isGroupCollapsed, setIsGroupCollapsed] = useState<boolean>(false);

  const toggleGroupCollapse = useCallback(() => {
    setIsGroupCollapsed((previousValue) => !previousValue);
  }, [setIsGroupCollapsed]);

  return (
    <div key={groupLabel}>
      <div
        className="conversation-group-items-title mb-3 inline-flex cursor-pointer items-center gap-1 text-neutrals-700"
        onClick={toggleGroupCollapse}
      >
        <IconCaretRightFilled
          className={classNames(
            'w-3 h-3 conversation-group-items-arrow',
            isGroupCollapsed ? 'rotate-[90deg]' : 'rotate-0',
          )}
        />
        <span className="body-3 conversation-group-items-title-text">
          {getLabelByGroup(groupLabel, titles)}
        </span>
      </div>
      {!isGroupCollapsed && (
        <div
          className={classNames(
            'flex flex-col gap-y-3',
            'conversation-group-items',
          )}
        >
          {sortConversationsByUpdatedAt(groupedConversations).map(
            (conversation) => (
              <ConversationItem
                isDisabled={isDisabled}
                key={conversation.id || conversation.name}
                conversation={conversation}
                selectedConversationId={selectedConversationId}
                onConversationClick={handleConversationClick}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationsGroup;
