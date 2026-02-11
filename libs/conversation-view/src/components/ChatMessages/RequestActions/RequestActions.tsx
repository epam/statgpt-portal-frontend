import { Message as MessageType } from '@epam/statgpt-dial-toolkit';
import classNames from 'classnames';
import { FC } from 'react';
import { MessageActionIcons } from '../../../models/message';
import { useAgentAvailability } from '@epam/statgpt-shared-toolkit';

interface Props {
  message: MessageType;
  messageActionsIcons?: MessageActionIcons;
  isStreaming?: boolean;
  onEditClick?: () => void;
  isReadOnly?: boolean;
}
export const RequestActionsPanel: FC<Props> = ({
  message,
  onEditClick,
  messageActionsIcons,
  isStreaming = false,
  isReadOnly = false,
}) => {
  const copy = messageActionsIcons?.copy;
  const regenerate = messageActionsIcons?.edit;
  const { isAgentAvailable } = useAgentAvailability();

  return (
    <div className={classNames('message-actions', 'flex gap-x-2 pt-2 ml-12')}>
      {copy && (
        <p onClick={() => navigator.clipboard.writeText(message.content)}>
          {copy}
        </p>
      )}
      {regenerate && !isStreaming && !isReadOnly && (
        <p
          onClick={isAgentAvailable ? onEditClick : undefined}
          className={classNames(
            !isAgentAvailable &&
              'opacity-50 !cursor-not-allowed pointer-events-none',
          )}
          aria-disabled={!isAgentAvailable}
        >
          {regenerate}
        </p>
      )}
    </div>
  );
};
