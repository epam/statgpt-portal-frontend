import { Message as MessageType } from '@epam/statgpt-dial-toolkit';
import classNames from 'classnames';
import { FC, useState } from 'react';
import { MessageActionIcons } from '../../../models/message';
import { LikeState } from '@epam/ai-dial-shared';
import { useAgentAvailability } from '@epam/statgpt-ui-components';

interface Props {
  message: MessageType;
  regenerateMessage?: (message: MessageType) => void;
  messageActionsIcons?: MessageActionIcons;
  rateResponse: (responseId: string, rate: LikeState) => void;
  isStreaming?: boolean;
  isReadOnly?: boolean;
  isRegenerateAvailable?: boolean;
}

export const AssistantActionsPanel: FC<Props> = ({
  message,
  regenerateMessage,
  messageActionsIcons,
  rateResponse,
  isStreaming = false,
  isReadOnly = false,
  isRegenerateAvailable = false,
}) => {
  const copy = messageActionsIcons?.copy;
  const regenerate = messageActionsIcons?.regenerate;
  const thumbUp = messageActionsIcons?.thumbUp;
  const thumbDown = messageActionsIcons?.thumbDown;
  const thumbPressed = messageActionsIcons?.thumbPressed;
  const [rate, setRate] = useState<LikeState>(
    message.like ?? LikeState.NoState,
  );
  const { isAgentAvailable } = useAgentAvailability();

  const handleRateResponse = (rate: LikeState) => {
    if (message.responseId) {
      setRate(rate);
      rateResponse(message.responseId || '', rate);
    }
  };

  return (
    <div className={classNames('message-actions', 'flex gap-x-2 pt-2')}>
      {copy && (
        <p onClick={() => navigator.clipboard.writeText(message.content)}>
          {copy}
        </p>
      )}
      {isRegenerateAvailable && regenerate && !isReadOnly && !isStreaming && (
        <p
          onClick={
            isAgentAvailable ? () => regenerateMessage?.(message) : undefined
          }
          aria-disabled={!isAgentAvailable}
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
          <p onClick={() => handleRateResponse(LikeState.Liked)}>{thumbUp}</p>
        ) : (
          <p>{thumbPressed}</p>
        ))}
      {thumbDown &&
        !isReadOnly &&
        rate !== LikeState.Liked &&
        (rate === LikeState.NoState ? (
          <p onClick={() => handleRateResponse(LikeState.Disliked)}>
            {thumbDown}
          </p>
        ) : (
          <p className="rotate-180">{thumbPressed}</p>
        ))}
    </div>
  );
};
