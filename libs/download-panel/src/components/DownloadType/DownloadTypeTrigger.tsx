import { FC, ReactNode } from 'react';
import ChevronSolidDownIcon from '@statgpt/ui-components/src/assets/icons/chevron-solid-down.svg';

interface Props {
  icon?: ReactNode;
  title?: string;
  showChevronIcon?: boolean;
}

export const DownloadTypeTrigger: FC<Props> = ({
  icon,
  title,
  showChevronIcon,
}) => {
  return (
    <div className="download-type-trigger cursor-pointer flex items-center gap-1">
      {icon}
      <span>{title}</span>
      {showChevronIcon && (
        <i className="chevron-icon">
          <ChevronSolidDownIcon className="w-6 h-6" />
        </i>
      )}
    </div>
  );
};
