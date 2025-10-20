import classNames from 'classnames';
import { FC, MouseEvent, ReactNode } from 'react';

interface Props {
  title?: string;
  buttonClassName: string;
  isBaseIconStyles?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export const IconButton: FC<Props> = ({
  icon,
  onClick,
  buttonClassName,
  disabled,
  title,
  isBaseIconStyles = true,
}) => {
  return (
    <button
      type="button"
      className={classNames(
        isBaseIconStyles && 'base-icon-button',
        buttonClassName,
      )}
      onClick={(e) => onClick?.(e)}
      disabled={disabled}
      title={title}
      aria-label="button"
    >
      {icon}
    </button>
  );
};
