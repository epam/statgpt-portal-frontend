'use client';

import { FC } from 'react';

interface Props {
  title?: string;
  text?: string;
  onClick?: (text?: string) => void;
}

export const Tag: FC<Props> = ({ title, text, onClick }) => {
  return (
    <button
      type="button"
      className="tag flex items-center justify-center"
      onClick={() => onClick?.(text || title)}
      aria-label="button"
    >
      <h4>{title}</h4>
    </button>
  );
};
