/**
 * ChatMessages - Message display and management component
 *
 * Renders a scrollable list of chat messages with support for different message types,
 * streaming indicators, empty states, auto-scrolling, and internationalization.
 * Integrates with the Message component for individual message rendering.
 */

'use client';

import { Role } from '@epam/ai-dial-shared';
import { useDebounce } from '@epam/statgpt-ui-components';
import { FC, ReactNode, useEffect, useRef, useState } from 'react';

import { Message as MessageType } from '@epam/statgpt-dial-toolkit';
import { FormatNumbersType } from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import classNames from 'classnames';
import { useAdvancedView } from '../../context/AdvancedViewContext';
import { AttachmentsActions } from '../../models/actions';
import { AttachmentsStyles } from '../../models/attachments-styles';
import {
  EditMessageTitles,
  MessageActionIcons,
  MessageStyles,
} from '../../models/message';
import { MetadataSettings } from '../../models/metadata';
import { ConversationViewTitles } from '../../models/titles';
import {
  getLastMessageWithAttachmentIndex,
  getPreviousMessageWithAttachment,
} from '../../utils/messages';
import Message from './Message/Message';

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
  rateResponse: (responseId: string, rate: boolean) => void;
  editMessageTitles: EditMessageTitles;
  scrollBottomIcon?: ReactNode;
  isReadOnlyConversation?: boolean;
}

const ChatMessages: FC<Props> = ({
  messages,
  isStreaming = false,
  isReadOnly,
  scrollBottomIcon,
  ...props
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isOpenedAdvancedView } = useAdvancedView();
  const [scrollPosition, setScrollPosition] = useState<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

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
      } else if (!showScrollButton) {
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

  return (
    <div ref={containerRef} className="h-full w-full">
      <div className="flex flex-col gap-y-6 max-w-full">
        {messages.map((message, index) => (
          <Message
            key={message.id || index}
            message={message}
            previousMessage={getPreviousMessageWithAttachment(messages, index)}
            onAdvancedViewOpen={onAdvancedViewOpen}
            isStreaming={isStreaming}
            isCurrentMessageStreaming={
              isStreaming &&
              index === messages.length - 1 &&
              message.role === Role.Assistant
            }
            showAdvancedView={
              index === getLastMessageWithAttachmentIndex(messages) &&
              !isReadOnly
            }
            isNotLastUserMessage={
              index === messages.length - 1 && message.role !== Role.User
            }
            {...props}
          />
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>
      <div
        onClick={scrollToBottom}
        className={classNames(
          'fixed right-10 lg:right-6 sm:hidden bottom-[88px] rounded-[50%] border-[2px] w-[40px] h-[40px] border-primary cursor-pointer text-primary bg-white',
          'scroll-button-wrapper',
          showScrollButton ? 'block' : 'hidden',
        )}
      >
        <div className="flex justify-center items-center w-full h-full">
          {scrollBottomIcon}
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;
