import { ShareConversationProps } from '@statgpt/conversation-view/src/models/share-conversation';
import { PopUpState } from '@statgpt/ui-components/src/types/pop-up';
import { FC, useCallback, useState } from 'react';
import ShareConversationModal from './ShareConversationModal';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { Button } from '@statgpt/ui-components/src/components/Button/Button';

interface Props extends ShareConversationProps {
  conversation?: ConversationInfo | null;
  locale?: string;
}

const ShareConversation: FC<Props> = ({
  shareButtonClass,
  shareIcon,
  ...props
}) => {
  const [modalState, setModalState] = useState(PopUpState.Closed);

  const onOpenShareModal = () => {
    setModalState(PopUpState.Opened);
  };

  const onClose = useCallback((): void => {
    setModalState(PopUpState.Closed);
  }, []);

  return (
    <>
      <Button
        buttonClassName={shareButtonClass || 'text-button-secondary'}
        title={props?.share || 'Share'}
        iconBefore={shareIcon}
        onClick={onOpenShareModal}
      />

      {modalState === PopUpState.Opened && (
        <ShareConversationModal onCloseModal={onClose} {...props} />
      )}
    </>
  );
};

export default ShareConversation;
