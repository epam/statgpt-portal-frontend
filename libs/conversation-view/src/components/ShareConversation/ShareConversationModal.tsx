import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { ShareConversationProps } from '@statgpt/conversation-view/src/models/share-conversation';
import {
  getConversationData,
  getConversationLink,
  getSharedConversation,
} from '@statgpt/conversation-view/src/utils/share-conversation';
import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { InputWithIcon } from '@statgpt/ui-components/src/components/Input/InputWithIcon';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';
import { Popup } from '@statgpt/ui-components/src/components/Popup/Popup';
import { PopUpSize } from '@statgpt/ui-components/src/types/pop-up';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { SharedConversationInfo } from '@statgpt/dial-toolkit/src';
import { ShareTarget } from '@statgpt/dial-toolkit/src/constants/share-conversation';
import { getSharedConversationsRequest } from '@statgpt/dial-toolkit/src/utils/shared-conversations-request';

interface Props extends ShareConversationProps {
  conversation?: ConversationInfo | null;
  locale?: string;
  onCloseModal: () => void;
}

const ShareConversationModal: FC<Props> = ({
  conversation,
  locale,
  onCloseModal,
  modalDividers,
  generateConversationLink,
  chatExpiration,
  chatExpirationDays,
  close,
  chatWarning,
  shareLink,
  shareCopyLink,
  shareCopiedLink,
  shareDescription,
  shareRemoveAccessToUsers,
  chatName,
  getSharedConversations,
  revokeSharedConversations,
  baseUrl,
}) => {
  const { id }: { id: string[] } = useParams();

  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [sharedConversation, setSharedConversation] =
    useState<SharedConversationInfo>();
  const [isLinkLoaded, setIsLinkLoaded] = useState<boolean>(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isDisabledRemoveButton, setIsDisabledRemoveButton] =
    useState<boolean>();

  const conversationLink = useMemo(() => {
    const url = baseUrl || window.location.origin;
    return `${url}/${locale}${generatedLink}`;
  }, [baseUrl, generatedLink, locale]);

  useEffect(() => {
    const generateShareConversationLink = async () => {
      try {
        const generatedLinkResponse = await generateConversationLink?.(
          getConversationData(
            conversation
              ? decodeURI(conversation?.id)
              : decodeURI(`${id?.[0]}/${locale}/${id?.[1]}`),
          ),
        );
        const sharedConversationsData = await getSharedConversations?.(
          getSharedConversationsRequest(ShareTarget.OTHERS),
        );

        if (generatedLinkResponse && sharedConversationsData) {
          setIsLinkLoaded(true);
          setGeneratedLink(getConversationLink(generatedLinkResponse));
          setSharedConversation(
            getSharedConversation(
              conversation,
              sharedConversationsData?.resources,
            ),
          );
        }
      } catch (err) {
        setIsLinkLoaded(false);
        console.error('Error sharing conversation', err as object);
      }
    };

    generateShareConversationLink();
  }, [
    conversation,
    generateConversationLink,
    getSharedConversations,
    id,
    locale,
  ]);

  const onClose = useCallback((): void => {
    onCloseModal();
    setGeneratedLink(null);
    setIsLinkLoaded(false);
    setIsCopiedLink(false);
  }, [onCloseModal]);

  const onCopyLink = useCallback((): void => {
    setIsCopiedLink(true);
    navigator.clipboard.writeText(conversationLink || '');
  }, [conversationLink]);

  const removeAccessToUsers = async () => {
    try {
      setIsDisabledRemoveButton(true);

      if (sharedConversation) {
        await revokeSharedConversations?.({ resources: [sharedConversation] });
      }
    } catch (error) {
      setIsDisabledRemoveButton(false);
      console.error('Error revoking shared conversation', error);
    }
  };

  const getShareIconButton = useCallback(() => {
    return (
      <Button
        buttonClassName={
          isCopiedLink ? 'text-button-secondary' : 'text-button-primary'
        }
        iconBefore={
          isCopiedLink ? (
            <IconCheck width={20} height={20} />
          ) : (
            <IconCopy width={20} height={20} />
          )
        }
        title={
          isCopiedLink
            ? (shareCopiedLink ?? 'Copied')
            : (shareCopyLink ?? 'Copy link')
        }
        disabled={isCopiedLink}
        onClick={onCopyLink}
      />
    );
  }, [isCopiedLink, onCopyLink, shareCopiedLink, shareCopyLink]);

  return (
    <Popup
      heading={shareLink ?? 'Share link'}
      portalId="share"
      size={PopUpSize.SM}
      dividers={modalDividers}
      onClose={onClose}
      closeButtonTitle={close ?? 'Close'}
    >
      {!isLinkLoaded ? (
        <div className="flex justify-center items-center py-6 px-6">
          <Loader />
        </div>
      ) : (
        <div className="share flex flex-col gap-y-4 px-6 pb-6 overflow-auto sm:p-0">
          {conversation?.name ? (
            <div className="flex share-info w-full">
              <p className="share-info-title text-neutrals-800 mr-1 body-1">
                {chatName ?? 'Chat name:'}
              </p>
              <h3
                className="flex-1 min-w-0 truncate"
                title={conversation?.name}
              >
                {conversation?.name}
              </h3>
            </div>
          ) : null}
          <div className="flex share-info">
            <p className="share-info-title text-neutrals-800 mr-1 body-1">
              {chatExpiration ?? 'Link expiration date:'}
            </p>
            <h3>3 {chatExpirationDays ?? 'days'}</h3>
          </div>
          <QRCodeSVG
            className="self-center border border-neutrals-600 p-2 rounded min-h-[200px]"
            value={conversationLink}
            size={200}
          />
          <p className="body-2 text-neutrals-1000">
            {shareDescription ??
              'Your name, special instructions, and any messages you add after sharing remain confidential.'}
          </p>
          <InputWithIcon
            containerClasses="share-input-container"
            cssClass="share-input"
            readonly={true}
            placeholder={conversationLink}
            value={conversationLink}
            inputId="conversationLink"
            iconAfterInput={getShareIconButton()}
          />
        </div>
      )}
      {isLinkLoaded ? (
        conversation && sharedConversation ? (
          <div className="remove-access">
            <Button
              title={shareRemoveAccessToUsers ?? 'Remove access to all users'}
              buttonClassName="remove-access-button py-3 px-4"
              isSmallButton={true}
              disabled={isDisabledRemoveButton}
              onClick={removeAccessToUsers}
            />
          </div>
        ) : (
          <p className="body-2 text-neutrals-800 share-footer">
            {chatWarning ?? 'This chat has not been shared with anyone yet.'}
          </p>
        )
      ) : (
        <div></div>
      )}
    </Popup>
  );
};

export default ShareConversationModal;
