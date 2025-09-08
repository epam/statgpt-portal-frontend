'use client';

import classNames from 'classnames';
import { FC, KeyboardEvent } from 'react';

export interface InputProps {
  type?: string;
  value?: string | number | null;
  placeholder?: string;
  inputId: string;
  cssClass?: string;
  disabled?: boolean;
  invalid?: boolean;
  readonly?: boolean;
  onChange?: (value: string) => void;
  onKeyDown?: (value: KeyboardEvent<HTMLInputElement>) => void;
}

export const Input: FC<InputProps> = ({
  value,
  inputId,
  placeholder = '',
  cssClass = '',
  type = 'text',
  disabled,
  readonly,
  onChange,
  onKeyDown,
}) => {
  const inputClass = classNames(
    'truncate outline-none shadow-none body-1',
    cssClass,
    readonly ? 'pointer-events-none' : '',
  );

  return (
    <input
      type={type}
      autoComplete="off"
      id={inputId}
      placeholder={placeholder}
      value={value || ''}
      title={value ? String(value) : ''}
      disabled={disabled}
      className={inputClass}
      onKeyDown={onKeyDown}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    />
  );
};
