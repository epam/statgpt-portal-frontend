import { ChangeEvent, FC, ReactNode, useCallback } from 'react';
import classNames from 'classnames';

interface Props {
  id: string;
  label?: string;
  checked: boolean;
  radioIcon?: ReactNode;
  description?: string;
  onChange?: (id: string, isChecked?: boolean) => void;
}

export const Radio: FC<Props> = ({
  label,
  id,
  checked,
  radioIcon,
  description,
  onChange,
}) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onChange?.(id, e.target.checked);
    },
    [onChange, id],
  );

  return (
    <label
      className="flex min-w-0 cursor-pointer flex-col py-[6px]"
      htmlFor={id}
    >
      <p className="radio-label flex min-w-0 items-center">
        <span
          className={classNames(
            'flex justify-center items-center w-4 h-4 mr-2 relative',
            'radio-button',
            checked ? 'radio-button-active' : '',
          )}
        >
          {checked && radioIcon}
        </span>
        {label && (
          <span
            className="radio-title body-1 min-w-0 flex-1 truncate pr-2 text-neutrals-1000"
            title={label}
          >
            {label}
          </span>
        )}
      </p>
      {description && (
        <span
          className="radio-description body-2 ml-6 flex w-auto items-center text-neutrals-800"
          title={description}
        >
          {description}
        </span>
      )}

      <input
        type="radio"
        onChange={handleChange}
        id={id}
        checked={checked}
        className="hidden"
      />
    </label>
  );
};
