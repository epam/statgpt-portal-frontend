/* eslint-disable @nx/enforce-module-boundaries */
import { Conversation } from '@epam/ai-dial-shared';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import ShareConversation from '@statgpt/share-conversation/src/components/ShareConversation/ShareConversation';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';

interface Props {
  conversation: Conversation | null;
  locale?: string;
  isOpenedAdvancedView?: boolean;
  isShowShareButton?: boolean;
  shareConversationProps?: ShareConversationProps;
  rightSlot?: ReactNode;
}

const ConversationViewHeader: FC<Props> = ({
  conversation,
  locale,
  isOpenedAdvancedView,
  isShowShareButton,
  shareConversationProps,
  rightSlot,
}) => {
  return (
    <>
      <header
        className={classNames(
          'bg-white border-b px-6 py-2 border-gray-200 flex justify-between items-center mobile:px-1',
          'conversation-view-header',
        )}
      >
        <span
          className={classNames(
            'flex-1 min-w-0 truncate h4',
            'conversation-view-header-text',
          )}
          title={conversation?.name}
        >
          {conversation?.name}
        </span>
        <div className="ml-3 flex items-center gap-4">
          {!isOpenedAdvancedView && isShowShareButton && (
            <div className="flex gap-x-2">
              <ShareConversation
                conversation={conversation}
                locale={locale}
                {...shareConversationProps}
              />
            </div>
          )}
          {rightSlot}
        </div>
      </header>
    </>
  );
};

export default ConversationViewHeader;
