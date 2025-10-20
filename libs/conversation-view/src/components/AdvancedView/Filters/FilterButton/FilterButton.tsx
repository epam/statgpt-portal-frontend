'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { FilterButtonProps } from '../../../../models/filters';
import { PopUpState } from '@statgpt/ui-components/src/types/pop-up';
import FilterIcon from '../../../../assets/icons/filter.svg';
import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';
import { getTooltipDataByElement } from '../../../../utils/get-tooltip-data.by-element';
import { ConversationViewTitles } from '../../../../models/titles';
import { Tooltip } from '../../../Tooltip/Tooltip';
import { OnboardingElements } from '../../../../constants/onboarding-elements';
import { useOnboarding } from '../../../../context/OnboardingContext';

interface Props {
  buttonProps?: FilterButtonProps;
  selectedFiltersCount?: number;
  isLoading?: boolean;
  titles?: ConversationViewTitles;
  setModalState: (modalState: PopUpState) => void;
}

const FilterButton: FC<Props> = ({
  buttonProps,
  selectedFiltersCount = 0,
  isLoading,
  setModalState,
  titles,
}) => {
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();

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
            iconBefore={<FilterIcon className="w-4 h-4" />}
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
            />
          )}
        </>
      )}
    </div>
  );
};

export default FilterButton;
