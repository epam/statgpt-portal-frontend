'use client';

import { Button, Popup, PopUpSize } from '@epam/statgpt-ui-components';
import { FC } from 'react';
import { ConversationListTitles } from '../../models/titles';

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
      <div className="py-4 px-6 sm:px-0" lang={locale}>
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
