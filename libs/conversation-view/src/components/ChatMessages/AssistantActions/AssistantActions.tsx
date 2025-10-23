import { Message as MessageType } from '@epam/statgpt-dial-toolkit';
import classNames from 'classnames';
import { FC, useState } from 'react';
import { MessageActionIcons } from '../../../models/message';

interface Props {
  message: MessageType;
  regenerateMessage?: (message: MessageType) => void;
  messageActionsIcons?: MessageActionIcons;
  rateResponse: (responseId: string, rate: boolean) => void;
  isStreaming?: boolean;
  isReadOnly?: boolean;
}
export const AssistantActionsPanel: FC<Props> = ({
  message,
  regenerateMessage,
  messageActionsIcons,
  rateResponse,
  isStreaming = false,
  isReadOnly = false,
}) => {
  const copy = messageActionsIcons?.copy;
  const regenerate = messageActionsIcons?.regenerate;
  const thumbUp = messageActionsIcons?.thumbUp;
  const thumbDown = messageActionsIcons?.thumbDown;
  const thumbPressed = messageActionsIcons?.thumbPressed;
  const [messageRate, setMessageRate] = useState<boolean | null>(null);

  const handleRateResponse = (rate: boolean) => {
    if (message.responseId) {
      setMessageRate(rate);
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
      {regenerate && !isReadOnly && !isStreaming && (
        <p
          onClick={() => {
            regenerateMessage?.(message);
          }}
        >
          {regenerate}
        </p>
      )}
      {thumbUp &&
        !isReadOnly &&
        messageRate !== false &&
        (messageRate === null ? (
          <p onClick={() => handleRateResponse(true)}>{thumbUp}</p>
        ) : (
          <p>{thumbPressed}</p>
        ))}
      {thumbDown &&
        !isReadOnly &&
        messageRate !== true &&
        (messageRate === null ? (
          <p onClick={() => handleRateResponse(false)}>{thumbDown}</p>
        ) : (
          <p className="rotate-180">{thumbPressed}</p>
        ))}
    </div>
  );
};
