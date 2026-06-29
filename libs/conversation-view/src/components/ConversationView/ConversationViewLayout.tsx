'use client';

import { Message } from '@epam/statgpt-dial-toolkit';
import { Button } from '@epam/statgpt-ui-components';
import { IconCopy, IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import { ConversationViewStylesProvider } from '../../context/ConversationViewStylesContext';
import ChatMessages from '../ChatMessages/ChatMessages';
import ConversationViewHeader from '../ConversationViewHeader/ConversationViewHeader';
import { ConversationInput } from './ConversationInput';
import { ConversationViewSidePanelOutlet } from './SidePanel/ConversationViewSidePanelContext';
import { ConversationViewModel } from './hooks/use-conversation-view';
import { ConversationViewProps } from './types';

type ConversationViewLayoutProps = ConversationViewProps &
  ConversationViewModel;

export const ConversationViewLayout: FC<ConversationViewLayoutProps> = ({
  conversation,
  locale,
  titles,
  messageStyles,
  attachmentsStyles,
  inputMessageStyles,
  formattingSettings,
  metadataSettings,
  messageActionsIcons,
  messageActionsTitles,
  editMessageTitles,
  expandStagesIcon,
  scrollBottomIcon,
  limitMessages,
  attachmentsConfig,
  shareConversationProps,
  showConversationHeaderAdvancedView = true,
  headerRightSlot,
  dataQuery,
  isFinalMessage,
  children,
  isReadonlyConversation,
  isStreaming,
  isOpenedAdvancedView,
  isShowOnboarding,
  isAgentAvailable,
  statusMessages,
  conversationViewState,
  messageServerActions,
  sendMessageToConversation,
  regenerateMessage,
  editMessage,
  onStopStreaming,
  isLastMessageFailed,
  regenerateLastMessage,
  rateResponse,
  handleCodeAttachmentUpdated,
  duplicateConversation,
  handleOpeningOfNewConversation,
}) => {
  return (
    <ConversationViewStylesProvider
      styles={{
        titles,
        messageStyles,
        attachmentsStyles,
        formattingSettings,
        messageActionsIcons,
        messageActionsTitles,
        editMessageTitles,
        expandStagesIcon,
        scrollBottomIcon,
        limitMessages,
        attachmentsConfig,
      }}
    >
      <div
        className={classNames(
          'h-full flex flex-col bg-white conversation-view-wrapper',
          isOpenedAdvancedView && !showConversationHeaderAdvancedView && 'p-4',
        )}
      >
        {isOpenedAdvancedView && !showConversationHeaderAdvancedView ? null : (
          <ConversationViewHeader
            conversation={conversation}
            locale={locale}
            isOpenedAdvancedView={isOpenedAdvancedView}
            isShowShareButton={!isReadonlyConversation && !isShowOnboarding}
            shareConversationProps={shareConversationProps}
            rightSlot={headerRightSlot}
          />
        )}
        <div className="flex min-h-0 w-full min-w-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              className={classNames(
                'flex-1 min-h-0 flex flex-col items-end scroll-hidden-container',
                messageStyles?.messagesWrapperClass,
              )}
            >
              <ChatMessages
                messages={conversation?.messages || []}
                actions={messageServerActions}
                isStreaming={isStreaming}
                isReadOnly={isReadonlyConversation}
                metadataSettings={metadataSettings}
                dataQuery={dataQuery}
                locale={locale}
                regenerateMessage={(message: Message) =>
                  regenerateMessage(message, conversation)
                }
                selectMessageToSend={(message, choiceId) =>
                  sendMessageToConversation(
                    message as string,
                    conversation,
                    choiceId as string,
                  )
                }
                rateResponse={rateResponse}
                editMessage={(message: Message) =>
                  editMessage(message, conversation)
                }
                isReadOnlyConversation={
                  isReadonlyConversation || isShowOnboarding
                }
                conversationViewState={conversationViewState}
                onCodeAttachmentUpdated={handleCodeAttachmentUpdated}
              />
            </div>
            {isShowOnboarding ? null : !isReadonlyConversation ? (
              <div
                className={classNames(inputMessageStyles.inputContainerClass)}
              >
                <ConversationInput
                  conversationViewState={conversationViewState}
                  isAgentAvailable={isAgentAvailable}
                  statusMessages={statusMessages}
                  isStreaming={isStreaming}
                  isLastMessageFailed={isLastMessageFailed}
                  regenerateLastMessage={regenerateLastMessage}
                  inputMessageStyles={inputMessageStyles}
                  askAnythingTitle={titles?.askAnything}
                  onSendMessage={(message) =>
                    sendMessageToConversation(message, conversation)
                  }
                  onStopStreaming={onStopStreaming}
                />
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-center">
                <Button
                  iconBefore={<IconCopy width={20} height={20} />}
                  title={titles?.duplicate ?? 'Duplicate Chat'}
                  isSmallButton={true}
                  onClick={duplicateConversation}
                  buttonClassName={classNames('text-button-secondary')}
                />
              </div>
            )}
            {isShowOnboarding && isFinalMessage && (
              <Button
                iconBefore={<IconPlus width={24} height={24} />}
                title={titles?.onboardingFooterLink}
                onClick={handleOpeningOfNewConversation}
                isSmallButton={true}
                buttonClassName="text-button-secondary self-center mb-3"
              />
            )}
            {children}
          </div>
          {!isOpenedAdvancedView && (
            <ConversationViewSidePanelOutlet scope="conversation" />
          )}
        </div>
      </div>
    </ConversationViewStylesProvider>
  );
};
