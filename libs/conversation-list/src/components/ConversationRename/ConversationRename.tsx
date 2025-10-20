'use client';

import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { Popup } from '@statgpt/ui-components/src/components/Popup/Popup';
import { PopUpSize } from '@statgpt/ui-components/src/types/pop-up';
import { FC, useState } from 'react';
import { ConversationListTitles } from '../../models/titles';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { Input } from '@statgpt/ui-components/src/components/Input/Input';
import { getClearedConversationName } from '@statgpt/shared-toolkit/src';

interface Props {
  conversation: ConversationInfo;
  disableModalDividers?: boolean;
  isSmallButton?: boolean;
  titles: ConversationListTitles;
  locale: string;
  onCloseModal: () => void;
  renameCoversation: (conversationId: string, name: string) => void;
}

const ConversationRename: FC<Props> = ({
  conversation,
  onCloseModal,
  renameCoversation,
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
    renameCoversation(
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
      <div className="py-4 px-6 sm:px-0" lang={locale}>
        <Input
          inputId="rename"
          value={value}
          onChange={onInputChange}
          cssClass="w-full"
        />
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
