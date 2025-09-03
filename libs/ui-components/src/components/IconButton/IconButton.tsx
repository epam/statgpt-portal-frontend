import classNames from 'classnames';
import { FC, MouseEvent, ReactNode } from 'react';

interface Props {
  title?: string;
  buttonClassName: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const IconButton: FC<Props> = ({
  icon,
  onClick,
  buttonClassName,
  disabled,
  title,
}) => {
  return (
    <button
      type="button"
      className={classNames(buttonClassName, 'base-icon-button')}
      onClick={(e) => onClick?.(e)}
      disabled={disabled}
      title={title}
      aria-label="button"
    >
      {icon}
    </button>
  );
};

export default IconButton;
