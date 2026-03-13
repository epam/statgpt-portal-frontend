import classNames from 'classnames';
import { FC, MouseEvent, ReactNode } from 'react';
import { Loader } from '../Loader/Loader';
import { mergeClasses } from '../../utils/mergeClasses';

interface Props {
  title?: string;
  buttonClassName: string;
  textClassName?: string;
  isLoading?: boolean;
  disabled?: boolean;
  iconBefore?: ReactNode;
  iconAfter?: ReactNode;
  isSmallButton?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export const Button: FC<Props> = ({
  buttonClassName,
  textClassName,
  isLoading = false,
  title,
  disabled,
  iconAfter,
  iconBefore,
  onClick,
  isSmallButton,
}) => {
  const btnTextClassNames = mergeClasses([
    isSmallButton ? 'font-semibold' : '',
    iconAfter ? 'mr-2' : '',
    iconBefore ? 'ml-2' : '',
    textClassName,
  ]);

  return (
    <button
      type="button"
      className={classNames(
        'base-button',
        buttonClassName,
        isSmallButton ? 'small-button' : '',
      )}
      disabled={disabled || isLoading}
      aria-label="button"
      onClick={(e) => onClick?.(e)}
      title={title}
    >
      {iconBefore}
      {isLoading && <Loader />}
      {title ? (
        isSmallButton ? (
          <h4 className={btnTextClassNames}>{title}</h4>
        ) : (
          <h3 className={btnTextClassNames}>{title}</h3>
        )
      ) : null}
      {iconAfter}
    </button>
  );
};
