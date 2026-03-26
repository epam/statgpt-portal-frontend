'use client';

import { ConversationInfo } from '@epam/ai-dial-shared';
import { getClearedConversationName } from '@epam/statgpt-shared-toolkit';
import { Button, Input, Popup, PopUpSize } from '@epam/statgpt-ui-components';
import { FC, useState } from 'react';
import { ConversationListTitles } from '../../models/titles';

interface Props {
  conversation: ConversationInfo;
  disableModalDividers?: boolean;
  isSmallButton?: boolean;
  titles: ConversationListTitles;
  locale: string;
  onCloseModal: () => void;
  renameConversation: (conversationId: string, name: string) => void;
}

const ConversationRename: FC<Props> = ({
  conversation,
  onCloseModal,
  renameConversation,
  locale,
  disableModalDividers,
  titles,
  isSmallButton,
}) => {
  const [value, setValue] = useState<string>(conversation?.name || '');
  const onInputChange = (value: string) => {
    setValue(value);
  };

  const onRenameSubmit = () => {
    const renamedConversationId = `${conversation?.folderId}/${encodeURIComponent(getClearedConversationName(value))}-${new Date().getTime()}`;
    renameConversation(
      `conversations/${conversation.id}`,
      `conversations/${renamedConversationId}`,
    );
  };

  return (
    <Popup
      heading={titles?.renameTitle ?? 'Rename conversation'}
      portalId="rename-conversation"
      containerClassName="rename-conversation-popup"
      size={PopUpSize.SM}
      dividers={!disableModalDividers}
      onClose={onCloseModal}
      closeButtonTitle={titles?.close ?? 'Cancel'}
    >
      <div className="px-6 py-4 sm:px-0" lang={locale}>
        <Input
          inputId="rename"
          value={value}
          onChange={onInputChange}
          cssClass="w-full"
        />
      </div>
      <div className="delete-conversation-popup-footer flex justify-end gap-x-2 px-6 py-3">
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
          buttonClassName="text-button-primary text-button-primary"
          title={titles?.save ?? 'Rename'}
          isSmallButton={isSmallButton}
          disabled={!value}
          onClick={(e) => {
            e.stopPropagation();
            onRenameSubmit();
          }}
        />
      </div>
    </Popup>
  );
};

export default ConversationRename;
