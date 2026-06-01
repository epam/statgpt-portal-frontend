import {
  ChangeEvent,
  FC,
  ReactNode,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import classNames from 'classnames';
import {
  IconSquareCheckFilled,
  IconSquareMinusFilled,
} from '@tabler/icons-react';
import { mergeClasses } from '../../utils/mergeClasses';

interface Props {
  id: string;
  label?: string;
  checked: boolean;
  indeterminate?: boolean;
  checkboxIcon?: ReactNode;
  onChange?: (id: string, isChecked?: boolean) => void;
  disabled?: boolean;
  className?: string;
  stopPropagation?: boolean;
}

export const Checkbox: FC<Props> = ({
  label,
  id,
  checked,
  indeterminate = false,
  checkboxIcon,
  onChange,
  disabled = false,
  className,
  stopPropagation = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = !checked && indeterminate;
    }
  }, [checked, indeterminate]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLLabelElement>) => {
      if (stopPropagation) {
        e.stopPropagation();
      }
    },
    [stopPropagation],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (stopPropagation) {
        e.stopPropagation();
      }

      onChange?.(id, e.target.checked);
    },
    [onChange, id, stopPropagation],
  );

  const getIcon = () => {
    if (checked) {
      if (checkboxIcon) return checkboxIcon;
      return <IconSquareCheckFilled className="absolute size-4" />;
    }
    if (indeterminate) {
      return <IconSquareMinusFilled className="absolute size-4" />;
    }
    return;
  };

  return (
    <label
      htmlFor={id}
      onClick={handleClick}
      className={mergeClasses(
        'flex min-w-0 items-center py-1 shrink-0',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span
        className={classNames(
          'checkbox-button relative flex size-[14px] items-center justify-center',
        )}
        aria-hidden
      >
        {getIcon()}
      </span>

      {label ? (
        <p
          className={classNames(
            'checkbox-button-text text-neutrals-1000 min-w-0 ml-2 flex-1 truncate pr-2',
          )}
          title={label}
        >
          {label}
        </p>
      ) : null}

      <input
        ref={inputRef}
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className="hidden"
      />
    </label>
  );
};
