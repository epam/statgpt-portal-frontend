/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { IconDotsVertical } from '@tabler/icons-react';
import { FC, ReactNode, useCallback, useMemo, useState } from 'react';
import { ConversationInfo, Conversation } from '@epam/ai-dial-shared';

import ConversationDelete from '../ConversationDelete/ConversationDelete';
import { getZippedFile } from '../../utils/compress-zip';
import { triggerDownload } from '../../utils/download';
import ShareConversationModal from '@statgpt/share-conversation/src/components/ShareConversation/ShareConversationModal';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { ConversationStyles } from '../../models/conversation-list';
import {
  Dropdown,
  DropdownItem,
  PopUpState,
} from '@epam/statgpt-ui-components';
import { ActionMenuItem } from '../../types/action-menu-item';
import ConversationRename from '../ConversationRename/ConversationRename';
import { ONBOARDING_MODEL_POSTFIX } from '@epam/statgpt-shared-toolkit';
import classNames from 'classnames';

interface Props {
  conversation: ConversationInfo;
  conversationStyles: ConversationStyles;
  shareConversationProps?: ShareConversationProps;
  onConversationDelete: (conversation: ConversationInfo) => void;
  getConversation: (conversationId: string) => Promise<Conversation>;
  getFileBlob: (path: string) => Promise<Blob>;
  renameConversation: (n: string, b: string) => Promise<unknown>;
  triggerButton?: ReactNode;
  locale: string;
  isDisabled?: boolean;
}

export const ActionMenu: FC<Props> = ({
  conversation,
  conversationStyles,
  shareConversationProps,
  onConversationDelete,
  getConversation,
  getFileBlob,
  renameConversation,
  triggerButton,
  locale,
  isDisabled,
}) => {
  const items: DropdownItem[] = useMemo(() => {
    const baseActions = [
      {
        key: ActionMenuItem.DELETE,
        title: conversationStyles?.titles?.delete ?? 'Delete',
        icon: conversationStyles.actionsIcons?.[ActionMenuItem.DELETE],
      },
    ];

    return conversation?.model?.id?.endsWith(ONBOARDING_MODEL_POSTFIX)
      ? baseActions
      : [
          ...(!conversation.isShared
            ? [
                {
                  key: ActionMenuItem.SHARE,
                  title: conversationStyles?.titles?.share ?? 'Share',
                  icon: conversationStyles.actionsIcons?.[ActionMenuItem.SHARE],
                },
                {
                  key: ActionMenuItem.RENAME,
                  title: conversationStyles?.titles?.rename ?? 'Rename',
                  icon: conversationStyles.actionsIcons?.[
                    ActionMenuItem.RENAME
                  ],
                },
              ]
            : []),
          {
            key: ActionMenuItem.EXPORT,
            title: conversationStyles?.titles?.export ?? 'Export',
            icon: conversationStyles.actionsIcons?.[ActionMenuItem.EXPORT],
          },
          ...baseActions,
        ];
  }, [
    conversation.isShared,
    conversation?.model?.id,
    conversationStyles.titles,
    conversationStyles.actionsIcons,
  ]);

  const [deleteModalState, setDeleteModalState] = useState(PopUpState.Closed);
  const [shareModalState, setShareModalState] = useState(PopUpState.Closed);
  const [renameModalState, setRenameModalState] = useState(PopUpState.Closed);

  const onCloseDeleteModal = useCallback((): void => {
    setDeleteModalState(PopUpState.Closed);
  }, [setDeleteModalState]);

  const onCloseShareModal = useCallback((): void => {
    setShareModalState(PopUpState.Closed);
  }, [setShareModalState]);

  const onCloseRenameModal = useCallback((): void => {
    setRenameModalState(PopUpState.Closed);
  }, [setRenameModalState]);

  const deleteConversation = useCallback(() => {
    onConversationDelete(conversation);
    onCloseDeleteModal();
  }, [conversation, onConversationDelete, onCloseDeleteModal]);

  const onRenameConversation = useCallback(
    (conversationId: string, updatedId: string) => {
      renameConversation(conversationId, updatedId);
      onCloseRenameModal();
    },
    [renameConversation, onCloseRenameModal],
  );

  const onOptionSelect = (key: string) => {
    if (key === ActionMenuItem.DELETE) {
      setDeleteModalState(PopUpState.Opened);
    }

    if (key === ActionMenuItem.SHARE) {
      setShareModalState(PopUpState.Opened);
    }

    if (key === ActionMenuItem.RENAME) {
      setRenameModalState(PopUpState.Opened);
    }

    if (key === ActionMenuItem.EXPORT) {
      getConversation(decodeURI(conversation.id)).then((conversation) => {
        getZippedFile(conversation, getFileBlob).then((result) => {
          triggerDownload(
            `data:application/zip;base64,${result}`,
            `chat_with_attachments_${new Date().toLocaleDateString()}.dial`,
          );
        });
      });
    }
  };

  return (
    <>
      <Dropdown
        containerClassName="ml-3 group-hover:visible invisible"
        triggerButton={triggerButton ?? <ActionTrigger disabled={isDisabled} />}
        options={items}
        openedClassName="action-menu-opened"
        onOptionSelect={onOptionSelect}
        disabled={isDisabled}
      />

      {deleteModalState === PopUpState.Opened && (
        <ConversationDelete
          titles={conversationStyles.titles}
          locale={locale}
          disableModalDividers={conversationStyles.disableModalDividers}
          isSmallButton={conversationStyles.isSmallModalButton}
          deleteConversation={deleteConversation}
          onCloseModal={onCloseDeleteModal}
        />
      )}

      {shareModalState === PopUpState.Opened && (
        <ShareConversationModal
          conversation={conversation}
          locale={locale}
          onCloseModal={onCloseShareModal}
          {...shareConversationProps}
        />
      )}

      {renameModalState === PopUpState.Opened && (
        <ConversationRename
          conversation={conversation}
          locale={locale}
          titles={conversationStyles.titles}
          renameConversation={onRenameConversation}
          onCloseModal={onCloseRenameModal}
          disableModalDividers={conversationStyles.disableModalDividers}
          isSmallButton={conversationStyles.isSmallModalButton}
        />
      )}
    </>
  );
};

const ActionTrigger: FC<{ disabled?: boolean }> = ({ disabled }) => {
  return (
    <div
      className={classNames(
        'flex items-center justify-center w-[24px]',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <IconDotsVertical
        width={20}
        height={20}
        stroke={2}
        className="text-primary"
      />
    </div>
  );
};
