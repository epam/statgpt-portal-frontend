/* eslint-disable @nx/enforce-module-boundaries */
import { Conversation } from '@epam/ai-dial-shared';
import classNames from 'classnames';
import { FC } from 'react';

import ShareConversation from '@statgpt/share-conversation/src/components/ShareConversation/ShareConversation';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { UserInfo } from '../../../../user-info/src/models/user-info';
import User from '../../../../user-info/src/components/User/User';

interface Props {
  conversation: Conversation | null;
  locale?: string;
  isOpenedAdvancedView?: boolean;
  isShowShareButton?: boolean;
  isShowUserInfo?: boolean;
  userInfo?: UserInfo;
  signOutTitle?: string;
  shareConversationProps?: ShareConversationProps;
  signOutAction?: () => void;
}

const ConversationViewHeader: FC<Props> = ({
  conversation,
  locale,
  isOpenedAdvancedView,
  isShowShareButton,
  isShowUserInfo,
  userInfo,
  signOutTitle,
  shareConversationProps,
  signOutAction,
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
        <div className="flex gap-4">
          {!isOpenedAdvancedView && isShowShareButton && (
            <div className="flex gap-x-2">
              <ShareConversation
                conversation={conversation}
                locale={locale}
                {...shareConversationProps}
              />
            </div>
          )}
          {isShowUserInfo && (
            <User
              userInfo={userInfo || null}
              signOutAction={signOutAction}
              title={signOutTitle}
            />
          )}
        </div>
      </header>
    </>
  );
};

export default ConversationViewHeader;
