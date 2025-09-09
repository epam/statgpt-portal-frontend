'use client';

import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { Popup } from '@statgpt/ui-components/src/components/Popup/Popup';
import { PopUpSize } from '@statgpt/ui-components/src/types/pop-up';
import { FC } from 'react';
import { ConversationListTitles } from '@statgpt/conversation-list/src/models/titles';

interface Props {
  disableModalDividers?: boolean;
  isSmallButton?: boolean;
  titles: ConversationListTitles;
  locale: string;
  onCloseModal: () => void;
  deleteConversation: () => void;
}

const ConversationDelete: FC<Props> = ({
  onCloseModal,
  disableModalDividers,
  deleteConversation,
  isSmallButton,
  titles,
  locale,
}) => {
  return (
    <Popup
      heading={titles?.deleteTitle ?? 'Delete conversation'}
      portalId="delete-conversation"
      containerClassName="delete-conversation-popup"
      size={PopUpSize.SM}
      dividers={!disableModalDividers}
      onClose={onCloseModal}
      closeButtonTitle={titles?.close ?? 'Cancel'}
    >
      <div className="py-4 px-6" lang={locale}>
        {titles?.deleteMessage ??
          'Are you sure you want to delete this conversation? This action cannot be undone.'}
      </div>
      <div className="flex justify-end gap-x-2 py-3 px-6 delete-conversation-popup-footer">
        <Button
          buttonClassName="cancel-button"
          title={titles?.cancel ?? 'Cancel'}
          isSmallButton={isSmallButton}
          onClick={(e) => {
            e.stopPropagation();
            onCloseModal();
          }}
        />
        <Button
          buttonClassName="text-button-primary text-button-primary-error"
          title={titles?.delete ?? 'Delete'}
          isSmallButton={isSmallButton}
          onClick={(e) => {
            e.stopPropagation();
            deleteConversation();
          }}
        />
      </div>
    </Popup>
  );
};

export default ConversationDelete;
