import { FC } from 'react';
import { LimitMessages } from '../RequestLimit/RequestLimit';

interface Props {
  limitMessages?: LimitMessages;
  query?: string;
}

export const DownloadFormatMessage: FC<Props> = ({ limitMessages, query }) => {
  return (
    <div className="flex flex-wrap items-center justify-between bg-hues-100 px-2 py-1">
      <div className="flex gap-x-[4px]">
        <div className="flex flex-col">
          <div className="flex gap-x-[4px]">
            <span className="h5 text-primary">
              {limitMessages?.excelFormatTitle}{' '}
            </span>
            <span className="body-3 text-neutrals-800">
              {limitMessages?.excelFormatText}
            </span>
          </div>
        </div>
      </div>
      <a href={query} target="_blank" rel="noreferrer">
        <span className="body-3 flex cursor-pointer items-center gap-x-[4px]">
          {limitMessages?.dataExplorerIcon}
          {limitMessages?.dataExplorer}
        </span>
      </a>
    </div>
  );
};
