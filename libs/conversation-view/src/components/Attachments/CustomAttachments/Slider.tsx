'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { ChartingIcon } from '../../../types/charting-icon';
import classNames from 'classnames';
import { Tooltip } from '../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../constants/onboarding-elements';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';
import { useIsMobile } from '@epam/statgpt-ui-components';

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
  const { titles } = useConversationViewStyles();
  const isMobile = useIsMobile(768);
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
  const itemWidthPercentage = totalCount > 0 ? 100 / totalCount : 0;

  return (
    <div
      className={classNames(
        'flex w-full flex-row items-center justify-center gap-2',
        isMobile && 'min-w-0',
      )}
    >
      <div
        className={classNames(
          'size-[20px] shrink-0 cursor-pointer',
          currentIndex === 0 ? 'text-neutrals-700' : 'text-primary',
        )}
        onClick={onPrev}
      >
        {icons?.[ChartingIcon.PREVIOUS]}
      </div>
      <div
        className={classNames(
          'flex flex-col items-center gap-1 pt-[20px]',
          isMobile && 'min-w-0 flex-1',
        )}
      >
        <div
          className={classNames(
            'relative h-[4px] rounded-full bg-neutral-300',
            isMobile && 'w-full',
          )}
          style={
            isMobile
              ? { maxWidth: `${MAX_SLIDER_WIDTH}px` }
              : { width: `${fullWidth}px` }
          }
        >
          <div
            className="absolute h-full rounded-full bg-primary"
            style={{
              left: `${leftShiftPercentage}%`,
              width: isMobile ? `${itemWidthPercentage}%` : `${itemWidth}px`,
            }}
          />
        </div>
        <h5
          className={classNames(
            'text-neutrals-800',
            isMobile && 'max-w-full truncate',
          )}
        >
          {currentIndex + 1}/{totalCount}
        </h5>
      </div>
      <div
        className={classNames(
          'size-[20px] shrink-0 cursor-pointer',
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
