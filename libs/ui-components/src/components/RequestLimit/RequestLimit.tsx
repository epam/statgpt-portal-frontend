import { FC, ReactNode } from 'react';
import { SERIES_LIMIT } from '../../constants/series-limit';
import classNames from 'classnames';

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
  containerClassName?: string;
  largeQueryClassName?: string;
  fullLimitMessageClassName?: string;
}
interface Props {
  limitMessages?: LimitMessages;
  isDownload?: boolean;
  showAdvancedViewButton?: boolean;
  onAdvancedViewClick?: () => void;
  query?: string;
}

export const RequestLimitMessage: FC<Props> = ({
  limitMessages: lm,
  isDownload,
  showAdvancedViewButton,
  onAdvancedViewClick,
  query,
}) => {
  return (
    <div
      className={classNames(
        'bg-semantic-warning-light px-2 py-1 flex justify-between flex-wrap items-center',
        lm?.containerClassName,
      )}
    >
      <div className="flex gap-x-2">
        <span>{lm?.warningIcon}</span>
        <div className="flex flex-col">
          <div className="flex gap-x-[4px]">
            <span
              className={classNames('text-primary h5', lm?.largeQueryClassName)}
            >
              {lm?.largeQuery}:{' '}
            </span>
            <span
              className={classNames(
                'text-neutrals-800 body-3',
                lm?.fullLimitMessageClassName,
              )}
            >
              {isDownload
                ? lm?.downloadMessage?.(SERIES_LIMIT)
                : lm?.showingLimit?.(SERIES_LIMIT)}
            </span>
          </div>
          {isDownload && (
            <span className="text-neutrals-800 body-3">
              {lm?.fullLimitMessage}
            </span>
          )}
        </div>
      </div>

      {showAdvancedViewButton && (
        <span
          onClick={() => onAdvancedViewClick?.()}
          className="flex gap-x-[4px] h4 cursor-pointer items-center text-primary"
        >
          {lm?.editIcon}
          {lm?.refineInAdvancedView}
        </span>
      )}
      {isDownload && (
        <a href={query || ''} target="_blank">
          <span className="flex gap-x-[4px] body-3 cursor-pointer items-center">
            {lm?.dataExplorerIcon}
            {lm?.dataExplorer}
          </span>
        </a>
      )}
    </div>
  );
};
