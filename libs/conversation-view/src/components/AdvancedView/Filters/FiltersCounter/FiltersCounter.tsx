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
    <div className="body-3 text-neutrals-800 sm:text-center flex gap-x-[4px] sm:justify-center items-center">
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
