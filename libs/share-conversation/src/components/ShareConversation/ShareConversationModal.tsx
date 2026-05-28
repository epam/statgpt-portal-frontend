import { IconCheck, IconCopy, IconInfoCircle } from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConversationInfo } from '@epam/ai-dial-shared';
import {
  getSharedConversationsRequest,
  SharedConversationInfo,
  ShareTarget,
} from '@epam/statgpt-dial-toolkit';
import {
  Button,
  InlineAlert,
  InlineAlertType,
  InputWithIcon,
  Loader,
  Popup,
  PopUpSize,
} from '@epam/statgpt-ui-components';
import { SHARE_CONVERSATION_ROUTE } from '@epam/statgpt-shared-toolkit';
import { ShareConversationProps } from '../../models/share-conversation';
import {
  getConversationData,
  getConversationLink,
  getConversationResources,
  getSharedConversation,
} from '../../utils/shared-conversations';

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
  getConversation,
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
  id,
  clientSharedPage,
  clientSharedProp,
  shareAlertMessage,
}) => {
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [sharedConversation, setSharedConversation] =
    useState<SharedConversationInfo>();
  const [isLinkLoaded, setIsLinkLoaded] = useState<boolean>(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isDisabledRemoveButton, setIsDisabledRemoveButton] =
    useState<boolean>();
  const initializedConversationKeyRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const conversationKey = useMemo(() => {
    if (conversation?.id) {
      return decodeURI(conversation.id);
    }

    if (id?.[0] && id?.[1] && locale) {
      return decodeURI(`${id[0]}/${locale}/${id[1]}`);
    }

    return null;
  }, [conversation?.id, id, locale]);

  const conversationLink = useMemo(() => {
    if (!generatedLink) {
      return '';
    }

    const url = baseUrl || window.location.origin;

    if (
      baseUrl &&
      baseUrl !== window.location.origin &&
      clientSharedPage &&
      clientSharedProp
    ) {
      const generatedConversationId = generatedLink.split(
        `/${SHARE_CONVERSATION_ROUTE}/`,
      )?.[1];
      return `${url}/${clientSharedPage}?${clientSharedProp}=${generatedConversationId}`;
    }

    return `${url}/${locale}${generatedLink}`;
  }, [baseUrl, generatedLink, locale, clientSharedPage, clientSharedProp]);

  const loadSharedConversation = useCallback(
    async (targetKey: string) => {
      const sharedConversationsData = await getSharedConversations?.(
        getSharedConversationsRequest(ShareTarget.OTHERS),
      );

      if (!sharedConversationsData) {
        return undefined;
      }

      return getSharedConversation(
        { id: targetKey } as ConversationInfo,
        sharedConversationsData.resources,
      );
    },
    [getSharedConversations],
  );

  useEffect(() => {
    if (!conversationKey) {
      return;
    }

    if (initializedConversationKeyRef.current === conversationKey) {
      return;
    }

    initializedConversationKeyRef.current = conversationKey;
    setIsLinkLoaded(false);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const generateShareConversationLink = async () => {
      try {
        const conversationDetails = await getConversation?.(conversationKey);
        const data = getConversationData(
          conversationKey,
          getConversationResources(conversationDetails),
        );
        const generatedLinkResponse = await generateConversationLink?.(data);
        const currentSharedConversation =
          await loadSharedConversation(conversationKey);

        if (controller.signal.aborted || !generatedLinkResponse) {
          return;
        }

        setGeneratedLink(getConversationLink(generatedLinkResponse));
        setSharedConversation(currentSharedConversation);
        setIsLinkLoaded(true);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setIsLinkLoaded(false);
        console.error('Error sharing conversation', err as object);
      }
    };

    generateShareConversationLink();

    return () => {
      controller.abort();
      initializedConversationKeyRef.current = null;
    };
  }, [
    conversationKey,
    generateConversationLink,
    getConversation,
    loadSharedConversation,
  ]);

  const onClose = useCallback((): void => {
    abortControllerRef.current?.abort();
    initializedConversationKeyRef.current = null;
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
        await revokeSharedConversations?.({
          resources: [sharedConversation],
        });
      }

      if (conversationKey) {
        const currentSharedConversation =
          await loadSharedConversation(conversationKey);

        if (!abortControllerRef.current?.signal.aborted) {
          setSharedConversation(currentSharedConversation);
        }
      }
    } catch (error) {
      console.error('Error revoking shared conversation', error);
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsDisabledRemoveButton(false);
      }
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
        <div className="flex items-center justify-center p-6">
          <Loader />
        </div>
      ) : (
        <div className="share flex flex-col gap-y-4 overflow-auto px-6 pb-6 sm:p-0">
          {shareAlertMessage ? (
            <InlineAlert
              type={InlineAlertType.Note}
              icon={<IconInfoCircle width={16} height={16} />}
            >
              {shareAlertMessage}
            </InlineAlert>
          ) : null}
          {conversation?.name ? (
            <div className="share-info flex w-full">
              <p className="share-info-title body-1 mr-1 text-neutrals-800">
                {chatName ?? 'Chat name:'}
              </p>
              <h3
                className="min-w-0 flex-1 truncate"
                title={conversation?.name}
              >
                {conversation?.name}
              </h3>
            </div>
          ) : null}
          <div className="share-info flex">
            <p className="share-info-title body-1 mr-1 text-neutrals-800">
              {chatExpiration ?? 'Link expiration date:'}
            </p>
            <h3>3 {chatExpirationDays ?? 'days'}</h3>
          </div>
          <QRCodeSVG
            className="min-h-[200px] self-center rounded border border-neutrals-600 p-2"
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
          <p className="body-2 share-footer text-neutrals-800">
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
