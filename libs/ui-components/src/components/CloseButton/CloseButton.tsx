import { FC, MouseEvent } from 'react';
import { IconX } from '@tabler/icons-react';
import { I18nKeys } from '@statgpt/locales/src/constants/i18n-keys';
import { useI18n } from '@statgpt/locales/src/client';

interface Props {
  title?: string;
  btnClassNames?: string;
  iconWidth?: number;
  iconHeight?: number;
  onClick?: (event?: MouseEvent<HTMLButtonElement>) => void;
}

const CloseButton: FC<Props> = ({
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

export default CloseButton;
