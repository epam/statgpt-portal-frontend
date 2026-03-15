'use client';

import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { FilterButtonProps } from '../../../../models/filters';
import {
  Button,
  PopUpState,
  Loader,
  SERIES_LIMIT,
} from '@epam/statgpt-ui-components';
import FilterIcon from '../../../../assets/icons/filter.svg';
import { getTooltipDataByElement } from '../../../../utils/get-tooltip-data.by-element';
import { useConversationViewTitles } from '../../../../context/ConversationViewTitlesContext';
import { Tooltip } from '../../../Tooltip/Tooltip';
import { OnboardingElements } from '../../../../constants/onboarding-elements';
import { useOnboarding } from '../../../../context/OnboardingContext';
import classNames from 'classnames';

interface Props {
  buttonProps?: FilterButtonProps;
  selectedFiltersCount?: number;
  isLoading?: boolean;
  setModalState: (modalState: PopUpState) => void;
  isModalClosed?: boolean;
  warningIcon?: ReactNode;
  filterIconClassName?: string;
  timeSeriesCount?: number;
}

const FilterButton: FC<Props> = ({
  buttonProps,
  selectedFiltersCount = 0,
  isLoading,
  setModalState,
  isModalClosed,
  warningIcon,
  filterIconClassName,
  timeSeriesCount,
}) => {
  const titles = useConversationViewTitles();
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();

  const isOverLimit = SERIES_LIMIT < (timeSeriesCount ?? 0);

  const title = useMemo(
    () =>
      !buttonProps?.isShowBadge
        ? `${buttonProps?.title}: ${selectedFiltersCount}`
        : buttonProps?.title,
    [buttonProps?.isShowBadge, buttonProps?.title, selectedFiltersCount],
  );

  useEffect(() => {
    if (isShowOnboarding) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.FILTERS,
        titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [titles, isShowOnboarding]);

  useEffect(() => {
    if (isShowOnboarding) {
      setIsTooltipVisible(
        onboardingFileSchema?.lastDisplayedElement ===
          OnboardingElements.FILTERS,
      );
    }
  }, [onboardingFileSchema?.lastDisplayedElement, isShowOnboarding]);

  return (
    <div className="relative filter-button-container" ref={filtersRef}>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Button
            iconBefore={
              <FilterIcon
                className={classNames('size-4', filterIconClassName)}
              />
            }
            iconAfter={isOverLimit ? warningIcon : undefined}
            title={title}
            buttonClassName="text-button-secondary filter-button"
            isSmallButton={true}
            onClick={() => setModalState(PopUpState.Opened)}
          />
          {buttonProps?.isShowBadge && (
            <div className="filter-count-badge">
              <h5>{selectedFiltersCount}</h5>
            </div>
          )}
          {isTooltipVisible && (
            <Tooltip
              reference={filtersRef}
              title={tooltipTitle}
              description={tooltipDescription}
              onReferenceClick={() => setModalState(PopUpState.Opened)}
              shouldCloseTooltip={isModalClosed}
            />
          )}
        </>
      )}
    </div>
  );
};

export default FilterButton;
