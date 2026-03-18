'use client';

import classNames from 'classnames';
import { FC } from 'react';

interface Props {
  title?: string;
  text?: string;
  disabled?: boolean;
  onClick?: (text?: string) => void;
}

export const Tag: FC<Props> = ({ title, text, disabled, onClick }) => {
  return (
    <button
      type="button"
      className={classNames(
        'tag flex items-center justify-center',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-neutrals-100',
      )}
      disabled={disabled}
      onClick={() => onClick?.(text || title)}
      aria-label="button"
    >
      <h4>{title}</h4>
    </button>
  );
};
