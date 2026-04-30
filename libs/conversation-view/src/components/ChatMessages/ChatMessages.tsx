/**
 * ChatMessages - Message display and management component
 *
 * Renders a scrollable list of chat messages with support for different message types,
 * streaming indicators, empty states, auto-scrolling, and internationalization.
 * Integrates with the Message component for individual message rendering.
 */

'use client';

import {
  FC,
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Attachment, LikeState, Role } from '@epam/ai-dial-shared';
import {
  useDebounce,
  LimitMessages,
  InlineAlert,
  InlineAlertType,
} from '@epam/statgpt-ui-components';
import {
  CustomViewState,
  ERROR_CONTEXT_KIND,
  Message as MessageType,
} from '@epam/statgpt-dial-toolkit';
import {
  DataQuery,
  FormatNumbersType,
  linkifyText,
} from '@epam/statgpt-shared-toolkit';
import Message from './Message/Message';
import {
  EditMessageTitles,
  MessageActionIcons,
  MessageStyles,
} from '../../models/message';
import { AttachmentsActions } from '../../models/actions';
import { AttachmentsStyles } from '../../models/attachments-styles';
import { MetadataSettings } from '../../models/metadata';
import { ConversationViewTitles } from '../../models/titles';
import {
  getLastMessageWithAttachmentIndex,
  getPreviousMessageWithAttachment,
} from '../../utils/messages';
import { useAdvancedView } from '../../context/AdvancedViewContext';
import classNames from 'classnames';
import { AttachmentsConfig } from '../../models/attachments';
import { IconExternalLink } from '@tabler/icons-react';
import { useConversationViewSidePanelOptional } from '../ConversationView/SidePanel/ConversationViewSidePanelContext';

interface Props {
  messages: MessageType[];
  isStreaming?: boolean;
  isReadOnly?: boolean;
  actions: AttachmentsActions;
  messageStyles?: MessageStyles;
  attachmentsStyles?: AttachmentsStyles;
  formattingSettings?: FormatNumbersType;
  locale: string;
  metadataSettings?: MetadataSettings;
  expandStagesIcon?: ReactNode;
  titles?: ConversationViewTitles;
  dataQuery?: DataQuery;
  regenerateMessage?: (message: MessageType) => void;
  editMessage?: (message: MessageType) => void;
  selectMessageToSend: (message?: string, choiceId?: string) => void;
  messageActionsIcons?: MessageActionIcons;
  rateResponse: (responseId: string, rate: LikeState) => void;
  editMessageTitles: EditMessageTitles;
  scrollBottomIcon?: ReactNode;
  isReadOnlyConversation?: boolean;
  limitMessages: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
  conversationViewState?: CustomViewState;
  onCodeAttachmentUpdated?: (messageId: string, attachment: Attachment) => void;
}

const ChatMessages: FC<Props> = ({
  messages,
  isStreaming = false,
  isReadOnly,
  scrollBottomIcon,
  conversationViewState,
  ...props
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isOpenedAdvancedView } = useAdvancedView();
  const sidePanel = useConversationViewSidePanelOptional();
  const [scrollPosition, setScrollPosition] = useState<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isConversationPanelVisible = sidePanel?.isPanelOpen() ?? false;

  const scrollToBottom = () => {
    const container = containerRef.current?.parentElement;
    const target = messagesEndRef.current;

    if (container && target) {
      const offsetTop = target.offsetTop - container.offsetTop;
      container.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  useEffect(() => {
    if (!isOpenedAdvancedView && scrollPosition !== null) {
      setTimeout(() => {
        containerRef?.current?.parentElement?.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
      });
    }
  }, [isOpenedAdvancedView, scrollPosition]);

  const onAdvancedViewOpen = () => {
    const scrollTop = containerRef.current?.parentElement?.scrollTop || null;
    setScrollPosition(scrollTop);
  };

  const handleScroll = () => {
    const container = containerRef.current?.parentElement;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight) {
        setShowScrollButton(false);
      } else if (!showScrollButton && !isOpenedAdvancedView) {
        setShowScrollButton(true);
      }
    }
  };

  useEffect(() => {
    if (isOpenedAdvancedView) {
      setShowScrollButton(false);
    }
  }, [isOpenedAdvancedView]);

  const handleScrollWithDelay = useDebounce(handleScroll, 300);
  useEffect(() => {
    const container = containerRef.current?.parentElement;
    container?.addEventListener('scroll', handleScrollWithDelay);

    return () =>
      container?.removeEventListener('scroll', handleScrollWithDelay);
  }, [handleScrollWithDelay]);

  const processErrorMessage = useCallback((message: string) => {
    const parts = linkifyText(message);

    return (
      <div className="whitespace-pre-wrap break-words">
        {parts.map((p, i) => {
          if (p.type === 'text') return <Fragment key={i}>{p.value}</Fragment>;

          return (
            <a
              key={i}
              href={p.value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center align-middle"
            >
              <IconExternalLink className="size-4 shrink-0 cursor-pointer text-primary" />
            </a>
          );
        })}
      </div>
    );
  }, []);

  return (
    <div ref={containerRef} className="flex size-full justify-center">
      <div className="chat-messages-wrapper flex w-full flex-col gap-y-6">
        {messages.map((message, index) => {
          const key = message.id ?? index;

          if (message.errorMessage) {
            const type =
              conversationViewState?.errorContext?.kind ===
              ERROR_CONTEXT_KIND.RATE_LIMIT
                ? InlineAlertType.Warning
                : InlineAlertType.Error;

            return (
              <InlineAlert key={key} type={type}>
                <div className="flex flex-col">
                  {processErrorMessage(message.errorMessage)}
                </div>
              </InlineAlert>
            );
          }

          if (isOpenedAdvancedView && message.role === Role.System) {
            return null;
          }

          const isLast = index === messages.length - 1;
          const previousMessage = getPreviousMessageWithAttachment(
            messages,
            index,
          );
          const lastMessageWithAttachmentIndex =
            getLastMessageWithAttachmentIndex(messages);

          return (
            <Message
              key={key}
              message={message}
              previousMessage={previousMessage}
              onAdvancedViewOpen={onAdvancedViewOpen}
              isStreaming={isStreaming}
              isCurrentMessageStreaming={
                isStreaming && isLast && message.role === Role.Assistant
              }
              showAdvancedView={
                index === lastMessageWithAttachmentIndex && !isReadOnly
              }
              isLastNotUserMessage={isLast && message.role !== Role.User}
              {...props}
            />
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>
      <div
        onClick={scrollToBottom}
        className={classNames(
          'fixed sm:hidden bottom-[88px] rounded-[50%] border-[2px] w-[40px] h-[40px] border-primary cursor-pointer text-primary bg-white z-10',
          isConversationPanelVisible
            ? 'right-[402px] lg:right-[386px]'
            : 'right-10 lg:right-6',
          'scroll-button-wrapper',
          showScrollButton ? 'block' : 'hidden',
        )}
      >
        <div className="flex size-full items-center justify-center">
          {scrollBottomIcon}
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;
