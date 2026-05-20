'use client';

import { Dataflow } from '@epam/statgpt-sdmx-toolkit';
import { FC, ReactNode } from 'react';
import DatasetTabsDefaultMode from './DatasetTabsDefaultMode';
import DatasetTabsCrossMode from './DatasetTabsCrossMode';
import { useConversationViewFeatureToggles } from '../../../../context/ConversationViewFeatureTogglesContext';

export interface DatasetTabsProps {
  datasets?: Dataflow[];
  locale?: string;
  isHideAdvancedViewButton?: boolean;
  openAdvancedViewIcon?: ReactNode;
  initialSelectedDatasetUrn?: string;
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
}) => {
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  if (isCrossDatasetModeOn) {
    return (
      <DatasetTabsCrossMode
        datasets={datasets}
        locale={locale}
        isHideAdvancedViewButton={isHideAdvancedViewButton}
        openAdvancedViewIcon={openAdvancedViewIcon}
        onOpenAdvancedView={onOpenAdvancedView}
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
    />
  );
};

export default DatasetTabs;
