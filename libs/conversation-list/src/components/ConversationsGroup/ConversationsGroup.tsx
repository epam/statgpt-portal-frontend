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
import {
  ConversationListActions,
  ConversationStyles,
} from '../../models/conversation-list';
import { IconCaretRightFilled } from '@tabler/icons-react';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';

interface Props {
  groupLabel: string;
  groupedConversations: ConversationInfo[];
  selectedConversationId?: string;
  conversationStyles: ConversationStyles;
  actions: ConversationListActions;
  locale: string;
  shareConversationProps?: ShareConversationProps;
  handleConversationClick: (folder: string, conversationId: string) => void;
}

const ConversationsGroup: FC<Props> = ({
  handleConversationClick,
  actions,
  selectedConversationId,
  groupLabel,
  conversationStyles,
  groupedConversations,
  shareConversationProps,
  locale,
}) => {
  const [isGroupCollapsed, setIsGroupCollapsed] = useState<boolean>(false);

  const toggleGroupCollapse = useCallback(() => {
    setIsGroupCollapsed((previousValue) => !previousValue);
  }, [setIsGroupCollapsed]);

  return (
    <div key={groupLabel}>
      <div
        className="inline-flex gap-1 items-center text-neutrals-700 mb-3 cursor-pointer conversation-group-items-title"
        onClick={toggleGroupCollapse}
      >
        <IconCaretRightFilled
          className={classNames(
            'w-3 h-3 conversation-group-items-arrow',
            isGroupCollapsed ? 'rotate-[90deg]' : 'rotate-0',
          )}
        />
        <span className="body-3 conversation-group-items-title-text">
          {getLabelByGroup(groupLabel, conversationStyles?.titles)}
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
                locale={locale}
                key={conversation.id || conversation.name}
                conversationStyles={conversationStyles}
                conversation={conversation}
                selectedConversationId={selectedConversationId}
                onConversationClick={handleConversationClick}
                actions={actions}
                shareConversationProps={shareConversationProps}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationsGroup;
