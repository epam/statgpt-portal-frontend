import { Conversation } from '@epam/ai-dial-shared';
import classNames from 'classnames';
import { FC } from 'react';

import ShareConversation from '@statgpt/conversation-view/src/components/ShareConversation/ShareConversation';
import { ShareConversationProps } from '@statgpt/conversation-view/src/models/share-conversation';

interface Props {
  conversation: Conversation | null;
  locale?: string;
  isOpenedAdvancedView?: boolean;
  shareConversationProps?: ShareConversationProps;
}

const ConversationViewHeader: FC<Props> = ({
  conversation,
  locale,
  isOpenedAdvancedView,
  shareConversationProps,
}) => {
  return (
    <>
      <header
        className={classNames(
          'bg-white border-b px-6 py-2 border-gray-200 flex justify-between items-center sm:hidden',
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

        {!isOpenedAdvancedView && (
          <div className="flex gap-x-2">
            <ShareConversation
              conversation={conversation}
              locale={locale}
              {...shareConversationProps}
            />
          </div>
        )}
      </header>
    </>
  );
};

export default ConversationViewHeader;
