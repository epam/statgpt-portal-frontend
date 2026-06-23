'use client';

import {
  LimitMessages,
  Popup,
  PopUpSize,
  PopUpState,
} from '@epam/statgpt-ui-components';
import { FC } from 'react';
import { useConversationViewStyles } from '../../../../context/ConversationViewStylesContext';
import {
  FilterButtonProps,
  FiltersModalProps,
} from '../../../../models/filters';
import FilterButton from '../FilterButton/FilterButton';
import { FilterSettingsController } from './filter-settings-controller';
import FilterSettings from './FiltersSettings';
import ModalFooter from './ModalFooter';

export interface FiltersModalShellProps {
  buttonProps?: FilterButtonProps;
  selectedFiltersCount: number;
  isLoading?: boolean;
  setModalState: (modalState: PopUpState) => void;
  isModalClosed?: boolean;
  filterIconClassName?: string;
  timeSeriesCount?: number;
  modalState: PopUpState;
  modalProps?: FiltersModalProps;
  controller: FilterSettingsController;
  onApply: () => void;
  onClose: () => void;
  onClearAllFilters: () => void;
  applyDisabled?: boolean;
  limitMessages?: LimitMessages;
}

const FiltersModalShell: FC<FiltersModalShellProps> = ({
  buttonProps,
  selectedFiltersCount,
  isLoading,
  setModalState,
  isModalClosed,
  filterIconClassName,
  timeSeriesCount,
  modalState,
  modalProps,
  controller,
  onApply,
  onClose,
  onClearAllFilters,
  applyDisabled,
  limitMessages,
}) => {
  const { titles } = useConversationViewStyles();

  return (
    <div className="filters-container">
      <FilterButton
        buttonProps={buttonProps}
        selectedFiltersCount={selectedFiltersCount}
        isLoading={isLoading}
        setModalState={setModalState}
        isModalClosed={isModalClosed}
        warningIcon={limitMessages?.warningIcon}
        filterIconClassName={filterIconClassName}
        timeSeriesCount={timeSeriesCount}
      />
      {modalState === PopUpState.Opened && (
        <Popup
          heading={titles?.settings || 'Settings'}
          portalId="filters"
          size={PopUpSize.LG}
          containerClassName="advanced-view-filters-modal h-[80%]"
          dividers={modalProps?.isShowDividers}
          onClose={onClose}
          closeButtonTitle={titles?.close || 'Close'}
        >
          <FilterSettings controller={controller} />
          <ModalFooter
            onApply={onApply}
            onClose={onClose}
            onClearAllFilters={onClearAllFilters}
            modalProps={modalProps}
            applyDisabled={applyDisabled}
            timeseriesLength={timeSeriesCount}
            limitMessages={limitMessages}
          />
        </Popup>
      )}
    </div>
  );
};

export default FiltersModalShell;
