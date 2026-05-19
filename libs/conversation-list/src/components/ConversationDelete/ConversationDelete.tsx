'use client';

import { Button, Popup, PopUpSize } from '@epam/statgpt-ui-components';
import { FC } from 'react';
import { useConversationStyles } from '../../context/ConversationStylesContext';

interface Props {
  locale: string;
  onCloseModal: () => void;
  deleteConversation: () => void;
}

const ConversationDelete: FC<Props> = ({
  onCloseModal,
  deleteConversation,
  locale,
}) => {
  const { titles, disableModalDividers, isSmallModalButton } =
    useConversationStyles();
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
      <div className="px-6 py-4 sm:px-0" lang={locale}>
        {titles?.deleteMessage ??
          'Are you sure you want to delete this conversation? This action cannot be undone.'}
      </div>
      <div className="delete-conversation-popup-footer flex justify-end gap-x-2 px-6 py-3">
        <Button
          buttonClassName="cancel-button"
          title={titles?.cancel ?? 'Cancel'}
          isSmallButton={isSmallModalButton}
          onClick={(e) => {
            e.stopPropagation();
            onCloseModal();
          }}
        />
        <Button
          buttonClassName="text-button-primary text-button-primary-error"
          title={titles?.delete ?? 'Delete'}
          isSmallButton={isSmallModalButton}
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
