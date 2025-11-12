import { FC } from 'react';
import { LimitMessages } from '../RequestLimit/RequestLimit';

interface Props {
  limitMessages?: LimitMessages;
  query?: string;
}

export const DownloadFormatMessage: FC<Props> = ({ limitMessages, query }) => {
  return (
    <div className="bg-hues-100 px-2 py-1 flex justify-between flex-wrap items-center">
      <div className="flex gap-x-[4px]">
        <div className="flex flex-col">
          <div className="flex gap-x-[4px]">
            <span className="text-primary h5">
              {limitMessages?.excelFormatTitle}{' '}
            </span>
            <span className="text-neutrals-800 body-3">
              {limitMessages?.excelFormatText}
            </span>
          </div>
        </div>
      </div>
      <a href={query} target="_blank">
        <span className="flex gap-x-[4px] body-3 cursor-pointer items-center">
          {limitMessages?.dataExplorerIcon}
          {limitMessages?.dataExplorer}
        </span>
      </a>
    </div>
  );
};
