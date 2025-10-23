'use client';

import { FC, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { Button } from '@epam/statgpt-ui-components';
import { EditMessageTitles } from '../../../models/message';

interface Props {
  content: string;
  textColorClass?: string;
  onCancel: () => void;
  onEditApply: (text: string) => void;
  editMessageTitles?: EditMessageTitles;
}

const MessageEdit: FC<Props> = ({
  content,
  textColorClass,
  onCancel,
  onEditApply,
  editMessageTitles,
}) => {
  const { isOpenedAdvancedView } = useAdvancedView();
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textRef.current;
    onInput();
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, []);

  const onInput = () => {
    const textarea = textRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  return (
    <div
      className={classNames(
        'max-w-none break-words',
        isOpenedAdvancedView ? 'body-2' : 'body-1',
        textColorClass,
      )}
    >
      <textarea
        ref={textRef}
        className="resize-none overflow-hidden outline-none bg-neutrals-300 w-full"
        defaultValue={content}
        onInput={onInput}
      />

      <div
        className={classNames(
          'flex gap-x-2 items-center',
          'edit-buttons-wrapper',
        )}
      >
        <Button
          buttonClassName="text-button-secondary small-icon-button"
          title={editMessageTitles?.cancel}
          isSmallButton
          onClick={onCancel}
        />
        <Button
          buttonClassName="text-button-primary small-icon-button"
          title={editMessageTitles?.send}
          isSmallButton
          onClick={() => onEditApply(textRef.current?.value || '')}
        />
      </div>
    </div>
  );
};

export default MessageEdit;
