/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { ConversationInfo } from '@epam/ai-dial-shared';
import { FC, useEffect, useState } from 'react';

import ConversationItem from '../ConversationItem/ConversationItem';
import { ConversationListActions } from '../../models/conversation-list';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { getClearedConversationName } from '@epam/statgpt-shared-toolkit';
import { sortConversationsByUpdatedAt } from '../../utils/conversations-grouping';
import { useConversationStyles } from '../../context/ConversationStylesContext';

interface Props {
  conversations: ConversationInfo[];
  selectedConversationId?: string;
  searchQuery?: string;
  locale: string;
  actions: ConversationListActions;
  shareConversationProps?: ShareConversationProps;
  handleConversationClick: (folder: string, conversationId: string) => void;
  isDisabled?: boolean;
}

const ConversationsSearchResult: FC<Props> = ({
  conversations,
  selectedConversationId,
  searchQuery,
  handleConversationClick,
  actions,
  locale,
  shareConversationProps,
  isDisabled,
}) => {
  const { titles } = useConversationStyles();
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
          {titles?.noConversation ?? 'No conversations yet'}
        </h3>
      ) : (
        filteredConversations.map((conversation) => (
          <ConversationItem
            locale={locale}
            key={conversation.id}
            conversation={conversation}
            searchQuery={searchQuery}
            selectedConversationId={selectedConversationId}
            onConversationClick={handleConversationClick}
            actions={actions}
            shareConversationProps={shareConversationProps}
            isDisabled={isDisabled}
          />
        ))
      )}
    </>
  );
};

export default ConversationsSearchResult;
