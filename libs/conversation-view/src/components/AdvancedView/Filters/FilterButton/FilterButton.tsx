'use client';

import { FC, useMemo } from 'react';
import { FilterButtonProps } from '@statgpt/conversation-view/src/models/filters';
import { PopUpState } from '@statgpt/ui-components/src/types/pop-up';
import FilterIcon from '@statgpt/conversation-view/src/assets/icons/filter.svg';
import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';

interface Props {
  buttonProps?: FilterButtonProps;
  selectedFiltersCount?: number;
  isLoading?: boolean;
  setModalState: (modalState: PopUpState) => void;
}

const FilterButton: FC<Props> = ({
  buttonProps,
  selectedFiltersCount = 0,
  isLoading,
  setModalState,
}) => {
  const title = useMemo(
    () =>
      !buttonProps?.isShowBadge
        ? `${buttonProps?.title}: ${selectedFiltersCount}`
        : buttonProps?.title,
    [buttonProps?.isShowBadge, buttonProps?.title, selectedFiltersCount],
  );

  return (
    <div className="relative filter-button-container">
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
        </>
      )}
    </div>
  );
};

export default FilterButton;
