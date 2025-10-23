/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { FC, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { ConversationInfo } from '@epam/ai-dial-shared';
import {
  ConversationListActions,
  ConversationStyles,
} from '../../models/conversation-list';
import { HighlightText } from '@epam/statgpt-ui-components';
import { ActionMenu } from '../ActionMenu/ActionMenu';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { getClearedConversationName } from '@epam/statgpt-shared-toolkit';

interface Props {
  conversation: ConversationInfo;
  selectedConversationId?: string;
  shareConversationProps?: ShareConversationProps;
  searchQuery?: string;
  locale: string;
  conversationStyles: ConversationStyles;
  onConversationClick: (folder: string, conversationId: string) => void;
  actions: ConversationListActions;
}

const ConversationItem: FC<Props> = ({
  conversation,
  selectedConversationId,
  searchQuery,
  onConversationClick,
  actions,
  locale,
  conversationStyles,
  shareConversationProps,
}) => {
  const conversationItemRef = useRef<HTMLDivElement | null>(null);
  const conversationName = getClearedConversationName(conversation?.name);

  useEffect(() => {
    if (conversation?.id === selectedConversationId) {
      conversationItemRef?.current?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  }, [conversation, selectedConversationId]);

  return (
    <div
      ref={conversationItemRef}
      className={classNames(
        'flex justify-between items-center py-2 px-3 border-transparent relative group cursor-pointer border hover:border-hues-600',
        'conversation-item',
        selectedConversationId === conversation?.id &&
          'bg-hues-100 conversation-item-active',
      )}
      onClick={() =>
        onConversationClick(conversation.folderId, conversation?.id)
      }
      title={conversationName}
    >
      <div className="flex w-full min-w-0 items-center">
        {conversationStyles.conversationItemIcon
          ? conversationStyles.conversationItemIcon
          : null}

        <h3
          className={classNames(
            'truncate font-semibold text-neutrals-1000 sm:body-2',
            'conversation-item-text',
            selectedConversationId === conversation?.id
              ? 'conversation-item-text-active'
              : '',
          )}
          title={conversationName}
        >
          {searchQuery?.length ? (
            <HighlightText
              text={conversationName}
              highlightText={searchQuery}
            />
          ) : (
            conversationName
          )}
        </h3>
      </div>
      <ActionMenu
        locale={locale}
        conversationStyles={conversationStyles}
        conversation={conversation}
        onConversationDelete={actions.deleteConversation}
        getConversation={actions.getConversation}
        getFileBlob={actions.getFileBlob}
        renameConversation={actions.renameConversation}
        shareConversationProps={shareConversationProps}
      />
    </div>
  );
};

export default ConversationItem;
