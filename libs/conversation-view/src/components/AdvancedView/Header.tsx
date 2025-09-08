import { useAdvancedView } from '@statgpt/conversation-view/src/context/AdvancedViewContext';
import { FC } from 'react';
import classNames from 'classnames';
import ShareConversation from '@statgpt/conversation-view/src/components/ShareConversation/ShareConversation';
import { CloseButton } from '@statgpt/ui-components/src/components/CloseButton/CloseButton';
import { ShareConversationProps } from '@statgpt/conversation-view/src/models/share-conversation';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

interface Props {
  isShowShare?: boolean;
  locale?: string;
  titles?: ConversationViewTitles;
  shareConversationProps?: ShareConversationProps;
}

const Header: FC<Props> = ({
  titles,
  locale,
  isShowShare,
  shareConversationProps,
}) => {
  const { setIsOpenedAdvancedView } = useAdvancedView();

  return (
    <header
      className={classNames(
        'bg-white px-6 py-4 flex justify-between items-center sm:px-0',
        'advanced-view-header',
      )}
    >
      <div
        className={classNames(
          'flex gap-3 items-center',
          !isShowShare && 'justify-between w-full',
        )}
      >
        <CloseButton
          btnClassNames={classNames(!isShowShare && 'order-2')}
          onClick={() => setIsOpenedAdvancedView(false)}
          title={titles?.close || 'Close'}
        />
        <h2 className="sm:h-3">
          {titles?.advanceViewTitle ?? 'Advanced view'}
        </h2>
      </div>
      {isShowShare && (
        <ShareConversation locale={locale} {...shareConversationProps} />
      )}
    </header>
  );
};

export default Header;
