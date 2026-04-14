'use client';

import {
  IconButton,
  InputWithIcon,
  KeyboardKey,
} from '@epam/statgpt-ui-components';
import { IconPlayerStopFilled, IconRefresh } from '@tabler/icons-react';
import { FC, KeyboardEvent, ReactNode, useCallback, useState } from 'react';
import classNames from 'classnames';

interface Props {
  containerClasses?: string;
  inputClasses?: string;
  inProcess?: boolean;
  disabled?: boolean;
  placeholder?: string;
  sendMessageIcon?: ReactNode;
  isLastFailed?: boolean;
  onSendMessage: (message: string) => void;
  onStopStreaming?: () => void;
  onRetryFailed?: () => Promise<void>;
  retryIcon?: ReactNode;
}

const InputForAsk: FC<Props> = ({
  inProcess,
  disabled,
  containerClasses,
  inputClasses,
  placeholder,
  sendMessageIcon,
  isLastFailed,
  retryIcon,
  onSendMessage,
  onStopStreaming,
  onRetryFailed,
}) => {
  const [inputData, setInputData] = useState<string>('');

  const onInputChange = useCallback(
    (value: string): void => {
      setInputData(value);
    },
    [setInputData],
  );

  const onSend = (value: string) => {
    if (inProcess || disabled) {
      return;
    }

    setInputData('');
    onSendMessage(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === KeyboardKey.Enter && !event.shiftKey) {
      if (isLastFailed) {
        onRetryFailed?.();
      } else {
        onSend(inputData.trim());
      }
    }
  };

  const getIcon = () => {
    if (disabled) {
      return null;
    }

    if (isLastFailed) {
      return (
        <IconButton
          buttonClassName="input-for-ask-button"
          onClick={() => onRetryFailed?.()}
          icon={retryIcon ? retryIcon : <IconRefresh />}
        />
      );
    }

    if (inProcess) {
      return (
        <IconButton
          buttonClassName="input-for-ask-button"
          onClick={() => onStopStreaming?.()}
          icon={<IconPlayerStopFilled />}
        />
      );
    }

    if (!inputData) return null;

    return (
      <IconButton
        buttonClassName="input-for-ask-button"
        onClick={() => onSend(inputData)}
        icon={sendMessageIcon}
      />
    );
  };

  return (
    <InputWithIcon
      inputId="ask-input"
      containerClasses={containerClasses}
      placeholder={placeholder}
      onChange={onInputChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      cssClass={classNames(inputClasses, 'input-for-ask')}
      value={inputData}
      iconAfterInput={getIcon()}
    />
  );
};

export default InputForAsk;
