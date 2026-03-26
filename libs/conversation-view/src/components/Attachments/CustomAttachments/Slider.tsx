'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { ChartingIcon } from '../../../types/charting-icon';
import classNames from 'classnames';
import { ConversationViewTitles } from '../../../models/titles';
import { Tooltip } from '../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../constants/onboarding-elements';
import { useOnboarding } from '../../../context/OnboardingContext';

const MAX_SLIDER_WIDTH = 200;
const BASE_ITEM_WIDTH = 8;
const MIN_ITEM_WIDTH = 2;

interface Props {
  currentIndex: number;
  totalCount: number;
  icons?: Record<ChartingIcon, ReactNode>;
  titles?: ConversationViewTitles;
  onPrev: () => void;
  onNext: () => void;
}

const Slider: FC<Props> = ({
  currentIndex,
  totalCount,
  icons,
  titles,
  onPrev,
  onNext,
}) => {
  const navRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();

  useEffect(() => {
    if (isShowOnboarding) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.CHARTS_NAVIGATION,
        titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [titles, isShowOnboarding]);

  useEffect(() => {
    if (isShowOnboarding) {
      const isCurrent =
        onboardingFileSchema?.lastDisplayedElement ===
        OnboardingElements.CHARTS_NAVIGATION;

      setIsTooltipVisible(isCurrent);

      if (isCurrent) {
        navRef?.current?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }
    }
  }, [onboardingFileSchema?.lastDisplayedElement, isShowOnboarding]);

  const leftShiftPercentage =
    totalCount > 0 ? (currentIndex / totalCount) * 100 : 0;
  const fullWidth =
    totalCount > 0
      ? Math.min(BASE_ITEM_WIDTH * totalCount, MAX_SLIDER_WIDTH)
      : 0;
  const itemWidth =
    totalCount > 0 ? Math.max(fullWidth / totalCount, MIN_ITEM_WIDTH) : 0;

  return (
    <div className="flex w-full flex-row items-center justify-center gap-2">
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
          className="relative h-[4px] rounded-full bg-neutral-300"
          style={{
            width: `${fullWidth}px`,
          }}
        >
          <div
            className="absolute h-full rounded-full bg-primary"
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
        ref={navRef}
      >
        {icons?.[ChartingIcon.NEXT]}
      </div>
      {isTooltipVisible && (
        <Tooltip
          reference={navRef}
          title={tooltipTitle}
          description={tooltipDescription}
        />
      )}
    </div>
  );
};

export default Slider;
