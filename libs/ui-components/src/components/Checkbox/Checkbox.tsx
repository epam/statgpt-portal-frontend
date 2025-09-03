import { ChangeEvent, FC, ReactNode, useCallback } from 'react';
import classNames from 'classnames';

interface Props {
  id: string;
  label?: string;
  checked: boolean;
  checkboxIcon?: ReactNode;
  onChange?: (id: string, isChecked?: boolean) => void;
}

const Checkbox: FC<Props> = ({
  label,
  id,
  checked,
  checkboxIcon,
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
      className="flex items-center cursor-pointer min-w-0 py-1"
      htmlFor={id}
    >
      <span
        className={classNames(
          'flex justify-center items-center w-4 h-4 mr-2 relative',
          'checkbox-button',
        )}
      >
        {checked && checkboxIcon}
      </span>
      {label && (
        <p
          className={classNames(
            'text-neutrals-1000 flex-1 min-w-0 truncate pr-2',
            'checkbox-button-text',
          )}
          title={label}
        >
          {label}
        </p>
      )}
      <input
        type="checkbox"
        onChange={handleChange}
        id={id}
        checked={checked}
        className="hidden"
      />
    </label>
  );
};

export default Checkbox;
