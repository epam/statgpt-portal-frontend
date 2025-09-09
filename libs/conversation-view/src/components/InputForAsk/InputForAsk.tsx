'use client';

import { IconButton } from '@statgpt/ui-components/src/components/IconButton/IconButton';
import { InputWithIcon } from '@statgpt/ui-components/src/components/Input/InputWithIcon';
import { KeyboardKey } from '@statgpt/ui-components/src/types/keyboard';
import { IconPlayerStopFilled } from '@tabler/icons-react';
import { FC, KeyboardEvent, ReactNode, useCallback, useState } from 'react';
import classNames from 'classnames';

interface Props {
  containerClasses?: string;
  inputClasses?: string;
  inProcess?: boolean;
  placeholder?: string;
  sendMessageIcon?: ReactNode;
  onSendMessage: (message: string) => void;
  onStopStreaming?: () => void;
}

const InputForAsk: FC<Props> = ({
  inProcess,
  containerClasses,
  inputClasses,
  placeholder,
  sendMessageIcon,
  onSendMessage,
  onStopStreaming,
}) => {
  const [inputData, setInputData] = useState<string>('');

  const onInputChange = useCallback(
    (value: string): void => {
      setInputData(value);
    },
    [setInputData],
  );

  const onSend = (value: string) => {
    setInputData('');
    onSendMessage(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === KeyboardKey.Enter && !event.shiftKey) {
      onSend(inputData.trim());
    }
  };

  return (
    <InputWithIcon
      inputId="ask-input"
      containerClasses={containerClasses}
      placeholder={placeholder}
      onChange={onInputChange}
      onKeyDown={onKeyDown}
      cssClass={classNames(inputClasses, 'input-for-ask')}
      value={inputData}
      iconAfterInput={
        inProcess ? (
          <IconButton
            buttonClassName="input-for-ask-button"
            onClick={() => onStopStreaming?.()}
            icon={<IconPlayerStopFilled />}
          />
        ) : (
          <IconButton
            buttonClassName="input-for-ask-button"
            onClick={() => onSend(inputData)}
            icon={sendMessageIcon}
          />
        )
      }
    />
  );
};

export default InputForAsk;
