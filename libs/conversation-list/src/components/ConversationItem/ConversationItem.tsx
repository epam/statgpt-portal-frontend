/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { FC, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { ConversationListActions } from '../../models/conversation-list';
import { HighlightText } from '@epam/statgpt-ui-components';
import { ActionMenu } from '../ActionMenu/ActionMenu';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { getClearedConversationName } from '@epam/statgpt-shared-toolkit';
import { useConversationStyles } from '../../context/ConversationStylesContext';

interface Props {
  conversation: ConversationInfo;
  selectedConversationId?: string;
  shareConversationProps?: ShareConversationProps;
  searchQuery?: string;
  isDisabled?: boolean;
  locale: string;
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
  isDisabled,
  shareConversationProps,
}) => {
  const { titles, conversationItemIcon } = useConversationStyles();
  const conversationItemRef = useRef<HTMLDivElement | null>(null);
  const conversationName = getClearedConversationName(conversation?.name);

  useEffect(() => {
    if (conversation?.id === selectedConversationId) {
      if (conversationItemRef?.current) {
        const container =
          conversationItemRef.current.parentElement?.parentElement
            ?.parentElement;

        if (container) {
          const itemRect = conversationItemRef.current.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          const elementHeight = itemRect.height;
          const containerHeight = containerRect.height;

          const offsetTop = itemRect.top - containerRect.top;

          const centerOffset =
            offsetTop +
            container.scrollTop -
            (containerHeight / 2 - elementHeight / 2);

          container.scrollTo({
            top: centerOffset,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [conversation, selectedConversationId]);

  return (
    <div
      ref={conversationItemRef}
      className={classNames(
        'flex justify-between items-center py-2 px-3 border-transparent relative group border',
        'conversation-item',
        selectedConversationId === conversation?.id &&
          'bg-hues-100 conversation-item-active',
        isDisabled
          ? 'cursor-not-allowed'
          : 'cursor-pointer hover:border-hues-600',
      )}
      onClick={() =>
        !isDisabled &&
        onConversationClick(conversation.folderId, conversation?.id)
      }
      title={isDisabled ? titles?.noActionsAllowed : conversationName}
    >
      <div className="flex min-w-0 flex-1 items-center">
        {conversationItemIcon ? conversationItemIcon : null}

        <h3
          className={classNames(
            'truncate font-semibold text-neutrals-1000 sm:body-2',
            'conversation-item-text',
            selectedConversationId === conversation?.id
              ? 'conversation-item-text-active'
              : '',
          )}
          title={isDisabled ? titles?.noActionsAllowed : conversationName}
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
        conversation={conversation}
        onConversationDelete={actions.deleteConversation}
        getConversation={actions.getConversation}
        getFileBlob={actions.getFileBlob}
        renameConversation={actions.renameConversation}
        shareConversationProps={shareConversationProps}
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default ConversationItem;
