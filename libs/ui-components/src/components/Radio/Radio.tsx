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

const Radio: FC<Props> = ({
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
      className="flex flex-col cursor-pointer min-w-0 py-[6px]"
      htmlFor={id}
    >
      <p className="radio-label flex items-center min-w-0">
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
            className="radio-title body-1 text-neutrals-1000 flex-1 min-w-0 truncate pr-2"
            title={label}
          >
            {label}
          </span>
        )}
      </p>
      {description && (
        <span
          className="radio-description ml-6 text-neutrals-800 body-2 w-auto flex items-center"
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

export default Radio;
