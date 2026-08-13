'use client';

import { FC, useEffect, useRef, useState } from 'react';
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
  const [isUnchanged, setIsUnchanged] = useState(true);

  useEffect(() => {
    const textarea = textRef.current;
    resizeTextarea();
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, []);

  const resizeTextarea = () => {
    const textarea = textRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const onInput = () => {
    resizeTextarea();
    setIsUnchanged((textRef.current?.value || '').trim() === content.trim());
  };

  const handleSubmit = () => {
    const text = textRef.current?.value || '';
    if (text.trim() === content.trim()) {
      onCancel();
      return;
    }
    onEditApply(text);
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
        className="w-full resize-none overflow-hidden bg-neutrals-300 outline-none"
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
          disabled={isUnchanged}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
};

export default MessageEdit;
