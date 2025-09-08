import { FC, MouseEvent } from 'react';
import { IconX } from '@tabler/icons-react';

interface Props {
  title?: string;
  btnClassNames?: string;
  iconWidth?: number;
  iconHeight?: number;
  onClick?: (event?: MouseEvent<HTMLButtonElement>) => void;
}

export const CloseButton: FC<Props> = ({
  title,
  btnClassNames,
  iconWidth,
  iconHeight,
  onClick,
}) => {
  return (
    <button
      type="button"
      aria-label="button"
      className={btnClassNames}
      title={title}
      onClick={onClick}
    >
      <IconX height={iconHeight || 20} width={iconWidth || 20} />
    </button>
  );
};
