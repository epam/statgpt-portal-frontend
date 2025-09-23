'use client';

import { FC, ReactNode } from 'react';
import { ChartingIcon } from '../../../types/charting-icon';
import classNames from 'classnames';

const MAX_SLIDER_WIDTH = 200;
const BASE_ITEM_WIDTH = 8;
const MIN_ITEM_WIDTH = 2;

interface Props {
  currentIndex: number;
  totalCount: number;
  icons?: Record<ChartingIcon, ReactNode>;
  onPrev: () => void;
  onNext: () => void;
}

const Slider: FC<Props> = ({
  currentIndex,
  totalCount,
  icons,
  onPrev,
  onNext,
}) => {
  const leftShiftPercentage =
    totalCount > 0 ? (currentIndex / totalCount) * 100 : 0;
  const fullWidth =
    totalCount > 0
      ? Math.min(BASE_ITEM_WIDTH * totalCount, MAX_SLIDER_WIDTH)
      : 0;
  const itemWidth =
    totalCount > 0 ? Math.max(fullWidth / totalCount, MIN_ITEM_WIDTH) : 0;

  return (
    <div className="w-full flex flex-row items-center gap-2 justify-center">
      <div
        className={classNames(
          'h-[20px] w-[20px] cursor-pointer',
          currentIndex === 0 ? 'text-neutrals-700' : 'text-primary',
        )}
        onClick={onPrev}
      >
        {icons?.[ChartingIcon.PREVIOUS]}
      </div>
      <div className="flex flex-col items-center gap-1 pt-[20px]">
        <div
          className="h-[4px] rounded-full bg-neutral-300 relative"
          style={{
            width: `${fullWidth}px`,
          }}
        >
          <div
            className="h-full rounded-full bg-primary absolute"
            style={{
              left: `${leftShiftPercentage}%`,
              width: `${itemWidth}px`,
            }}
          />
        </div>
        <h5 className="text-neutrals-800">
          {currentIndex + 1}/{totalCount}
        </h5>
      </div>
      <div
        className={classNames(
          'h-[20px] w-[20px]  cursor-pointer',
          currentIndex + 1 === totalCount
            ? 'text-neutrals-700'
            : 'text-primary',
        )}
        onClick={onNext}
      >
        {icons?.[ChartingIcon.NEXT]}
      </div>
    </div>
  );
};

export default Slider;
