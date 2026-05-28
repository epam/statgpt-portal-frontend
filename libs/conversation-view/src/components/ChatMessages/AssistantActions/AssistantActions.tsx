import { Message as MessageType } from '@epam/statgpt-dial-toolkit';
import classNames from 'classnames';
import { FC, useEffect, useRef, useState } from 'react';
import { MessageActionIcons } from '../../../models/message';
import { LikeState } from '@epam/ai-dial-shared';
import { useAgentAvailability } from '@epam/statgpt-ui-components';
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';

interface Props {
  message: MessageType;
  regenerateMessage?: (message: MessageType) => void;
  messageActionsIcons?: MessageActionIcons;
  rateResponse: (responseId: string, rate: LikeState) => void;
  isStreaming?: boolean;
  isReadOnly?: boolean;
  isRegenerateAvailable?: boolean;
}

const COPIED_RESET_MS = 2000;

export const AssistantActionsPanel: FC<Props> = ({
  message,
  regenerateMessage,
  messageActionsIcons,
  rateResponse,
  isStreaming = false,
  isReadOnly = false,
  isRegenerateAvailable = false,
}) => {
  const { messageActionsTitles } = useConversationViewStyles();
  const copy = messageActionsIcons?.copy;
  const copied = messageActionsIcons?.copied;
  const regenerate = messageActionsIcons?.regenerate;
  const thumbUp = messageActionsIcons?.thumbUp;
  const thumbDown = messageActionsIcons?.thumbDown;
  const thumbPressed = messageActionsIcons?.thumbPressed;
  const [rate, setRate] = useState<LikeState>(
    message.like ?? LikeState.NoState,
  );
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isAgentAvailable } = useAgentAvailability();

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleRateResponse = (rate: LikeState) => {
    if (message.responseId) {
      setRate(rate);
      rateResponse(message.responseId || '', rate);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => {
      setIsCopied(false);
    }, COPIED_RESET_MS);
  };

  return (
    <div className={classNames('message-actions', 'flex gap-x-2 pt-2')}>
      {copy && (
        <p onClick={handleCopy} title={messageActionsTitles?.copy}>
          {isCopied && copied ? copied : copy}
        </p>
      )}
      {isRegenerateAvailable && regenerate && !isReadOnly && !isStreaming && (
        <p
          onClick={
            isAgentAvailable ? () => regenerateMessage?.(message) : undefined
          }
          aria-disabled={!isAgentAvailable}
          title={messageActionsTitles?.regenerate}
          className={classNames(
            !isAgentAvailable &&
              'opacity-50 !cursor-not-allowed pointer-events-none',
          )}
        >
          {regenerate}
        </p>
      )}
      {thumbUp &&
        !isReadOnly &&
        rate !== LikeState.Disliked &&
        (rate === LikeState.NoState ? (
          <p
            onClick={() => handleRateResponse(LikeState.Liked)}
            title={messageActionsTitles?.like}
          >
            {thumbUp}
          </p>
        ) : (
          <p title={messageActionsTitles?.like}>{thumbPressed}</p>
        ))}
      {thumbDown &&
        !isReadOnly &&
        rate !== LikeState.Liked &&
        (rate === LikeState.NoState ? (
          <p
            onClick={() => handleRateResponse(LikeState.Disliked)}
            title={messageActionsTitles?.dislike}
          >
            {thumbDown}
          </p>
        ) : (
          <p className="rotate-180" title={messageActionsTitles?.dislike}>
            {thumbPressed}
          </p>
        ))}
    </div>
  );
};
