import { FC, ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  chevronIcon?: ReactNode;
  title?: string;
  showChevronIcon?: boolean;
}

export const DownloadTypeTrigger: FC<Props> = ({
  icon,
  chevronIcon,
  title,
  showChevronIcon,
}) => {
  return (
    <div className="download-type-trigger flex cursor-pointer items-center gap-1">
      {icon}
      <span>{title}</span>
      {showChevronIcon && <i className="chevron-icon">{chevronIcon}</i>}
    </div>
  );
};
