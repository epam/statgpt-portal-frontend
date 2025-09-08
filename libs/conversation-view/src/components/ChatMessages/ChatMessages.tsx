/**
 * ChatMessages - Message display and management component
 *
 * Renders a scrollable list of chat messages with support for different message types,
 * streaming indicators, empty states, auto-scrolling, and internationalization.
 * Integrates with the Message component for individual message rendering.
 */

'use client';

import { FC, ReactNode, useEffect, useRef } from 'react';
import { Role } from '@epam/ai-dial-shared';

import { Message as MessageType } from '@statgpt/dial-toolkit/src/models/message';
import Message from '@statgpt/conversation-view/src/components/ChatMessages/Message/Message';
import { MessageStyles } from '@statgpt/conversation-view/src/models/message';
import { AttachmentsActions } from '@statgpt/conversation-view/src/models/actions';
import { AttachmentsStyles } from '@statgpt/conversation-view/src/models/attachments-styles';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';
import { MetadataSettings } from '@statgpt/conversation-view/src/models/metadata';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

interface Props {
  messages: MessageType[];
  isStreaming?: boolean;
  actions: AttachmentsActions;
  messageStyles?: MessageStyles;
  showAdvancedView?: boolean;
  attachmentsStyles?: AttachmentsStyles;
  formattingSettings?: FormatNumbersType;
  locale: string;
  metadataSettings?: MetadataSettings;
  expandStagesIcon?: ReactNode;
  titles?: ConversationViewTitles;
}

const ChatMessages: FC<Props> = ({
  messages,
  isStreaming = false,
  ...props
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const target = messagesEndRef.current;

    if (container && target) {
      const offsetTop = target.offsetTop - container.offsetTop;
      container.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  }, [messages, isStreaming]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <div className="flex flex-col gap-y-6 max-w-full">
        {messages.map((message, index) => (
          <Message
            key={message.id || index}
            message={message}
            isStreaming={
              isStreaming &&
              index === messages.length - 1 &&
              message.role === Role.Assistant
            }
            {...props}
          />
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
};

export default ChatMessages;
