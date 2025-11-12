import { FC, ReactNode } from 'react';
import { SERIES_LIMIT } from '../../constants/series-limit';

export interface LimitMessages {
  seriesCount?: (counter: number) => string | undefined;
  largeQuery?: string;
  showingLimit?: (limit: number) => string | undefined;
  counterLimit?: (counter: number, limit: number) => string | undefined;
  warningIcon?: ReactNode;
  downloadMessage?: (limit: number) => string | undefined;
  refineInAdvancedView?: string;
  editIcon?: ReactNode;
  externalLink?: string;
  fullLimitMessage?: string;
  dataExplorer?: string;
  dataExplorerIcon?: ReactNode;
  excelFormatTitle?: string;
  excelFormatText?: string;
}
interface Props {
  limitMessages?: LimitMessages;
  isDownload?: boolean;
  showAdvancedViewButton?: boolean;
  onAdvancedViewClick?: () => void;
  query?: string;
}

export const RequestLimitMessage: FC<Props> = ({
  limitMessages,
  isDownload,
  showAdvancedViewButton,
  onAdvancedViewClick,
  query,
}) => {
  return (
    <div className="bg-accent-300 px-2 py-1 flex justify-between flex-wrap items-center">
      <div className="flex gap-x-[4px]">
        <span>{limitMessages?.warningIcon}</span>
        <div className="flex flex-col">
          <div className="flex gap-x-[4px]">
            <span className="text-primary h5">
              {limitMessages?.largeQuery}:{' '}
            </span>
            <span className="text-neutrals-800 body-3">
              {isDownload
                ? limitMessages?.downloadMessage?.(SERIES_LIMIT)
                : limitMessages?.showingLimit?.(SERIES_LIMIT)}
            </span>
          </div>
          {isDownload && (
            <span className="text-neutrals-800 body-3">
              {limitMessages?.fullLimitMessage}
            </span>
          )}
        </div>
      </div>

      {showAdvancedViewButton && (
        <span
          onClick={() => onAdvancedViewClick?.()}
          className="flex gap-x-[4px] body-3 cursor-pointer items-center"
        >
          {limitMessages?.editIcon}
          {limitMessages?.refineInAdvancedView}
        </span>
      )}
      {isDownload && (
        <a href={query || ''} target="_blank">
          <span className="flex gap-x-[4px] body-3 cursor-pointer items-center">
            {limitMessages?.dataExplorerIcon}
            {limitMessages?.dataExplorer}
          </span>
        </a>
      )}
    </div>
  );
};
