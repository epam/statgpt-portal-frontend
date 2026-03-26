'use client';

import { FC } from 'react';

import { SERIES_LIMIT, LimitMessages } from '@epam/statgpt-ui-components';

interface Props {
  timeseriesLength?: number;
  limitMessages?: LimitMessages;
}

const FiltersCounter: FC<Props> = ({ timeseriesLength = 0, limitMessages }) => {
  const showSeriesCounter =
    !timeseriesLength || SERIES_LIMIT > timeseriesLength;
  return (
    <div className="body-3 flex items-center gap-x-[4px] text-neutrals-800 sm:justify-center sm:text-center">
      {showSeriesCounter ? (
        <span>{limitMessages?.seriesCount?.(timeseriesLength)}</span>
      ) : (
        <>
          <span>{limitMessages?.warningIcon}</span>
          <span>
            {limitMessages?.counterLimit?.(timeseriesLength, SERIES_LIMIT)}
          </span>
        </>
      )}
    </div>
  );
};

export default FiltersCounter;
