'use client';

import { Dataflow } from '@epam/statgpt-sdmx-toolkit';
import { FC, ReactNode } from 'react';
import DatasetTabsDefaultMode from './DatasetTabsDefaultMode';
import DatasetTabsCrossMode from './DatasetTabsCrossMode';
import { ConversationViewTitles } from '../../../../models/titles';
import { useCrossDatasetMode } from '../../../../context/CrossDatasetModeContext';

export interface DatasetTabsProps {
  datasets?: Dataflow[];
  locale?: string;
  isHideAdvancedViewButton?: boolean;
  openAdvancedViewIcon?: ReactNode;
  initialSelectedDatasetUrn?: string;
  titles?: ConversationViewTitles;
  selectDataset?: (datasetUrn?: string) => void;
  onOpenAdvancedView?: () => void;
}

const DatasetTabs: FC<DatasetTabsProps> = ({
  datasets,
  locale,
  isHideAdvancedViewButton,
  openAdvancedViewIcon,
  initialSelectedDatasetUrn,
  selectDataset,
  onOpenAdvancedView,
  titles,
}) => {
  const { isCrossDatasetModeOn } = useCrossDatasetMode();
  if (isCrossDatasetModeOn) {
    return (
      <DatasetTabsCrossMode
        datasets={datasets}
        locale={locale}
        isHideAdvancedViewButton={isHideAdvancedViewButton}
        openAdvancedViewIcon={openAdvancedViewIcon}
        initialSelectedDatasetUrn={initialSelectedDatasetUrn}
        selectDataset={selectDataset}
        onOpenAdvancedView={onOpenAdvancedView}
        titles={titles}
      />
    );
  }

  return (
    <DatasetTabsDefaultMode
      datasets={datasets}
      locale={locale}
      isHideAdvancedViewButton={isHideAdvancedViewButton}
      openAdvancedViewIcon={openAdvancedViewIcon}
      initialSelectedDatasetUrn={initialSelectedDatasetUrn}
      selectDataset={selectDataset}
      onOpenAdvancedView={onOpenAdvancedView}
      titles={titles}
    />
  );
};

export default DatasetTabs;
