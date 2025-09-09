'use client';

import { ConversationInfo } from '@epam/ai-dial-shared';
import { FC, useEffect, useState } from 'react';

import ConversationItem from '@statgpt/conversation-list/src/components/ConversationItem/ConversationItem';
import {
  ConversationListActions,
  ConversationStyles,
} from '@statgpt/conversation-list/src/models/conversation-list';
import { ShareConversationProps } from '@statgpt/conversation-view/src/models/share-conversation';
import { getClearedConversationName } from '@statgpt/shared-toolkit/src/utils/conversation-name';
import { sortConversationsByUpdatedAt } from '@statgpt/conversation-list/src/utils/conversations-grouping';

interface Props {
  conversations: ConversationInfo[];
  selectedConversationId?: string;
  searchQuery?: string;
  locale: string;
  conversationStyles: ConversationStyles;
  actions: ConversationListActions;
  shareConversationProps?: ShareConversationProps;
  handleConversationClick: (folder: string, conversationId: string) => void;
}

const ConversationsSearchResult: FC<Props> = ({
  conversations,
  selectedConversationId,
  searchQuery,
  conversationStyles,
  handleConversationClick,
  actions,
  locale,
  shareConversationProps,
}) => {
  const [filteredConversations, setFilteredConversations] = useState<
    ConversationInfo[]
  >([]);

  useEffect(() => {
    setFilteredConversations(
      sortConversationsByUpdatedAt(
        conversations?.filter((conversation) =>
          getClearedConversationName(conversation?.name)?.includes(
            searchQuery || '',
          ),
        ),
      ),
    );
  }, [conversations, searchQuery]);

  return (
    <>
      {!filteredConversations?.length ? (
        <h3 className="text-neutrals-800">
          {conversationStyles?.titles?.noConversation ?? 'No conversations yet'}
        </h3>
      ) : (
        filteredConversations.map((conversation) => (
          <ConversationItem
            locale={locale}
            key={conversation.id}
            conversationStyles={conversationStyles}
            conversation={conversation}
            searchQuery={searchQuery}
            selectedConversationId={selectedConversationId}
            onConversationClick={handleConversationClick}
            actions={actions}
            shareConversationProps={shareConversationProps}
          />
        ))
      )}
    </>
  );
};

export default ConversationsSearchResult;
