'use client';

import { Attachment } from '@epam/ai-dial-shared';
import {
  DataConstraints,
  DatasetQueryFilters,
  Dimension,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import Filters from './Filters/Filters';
import { AdvancedAttachmentRenderer } from './AdvancedAttachmentRenderer';
import { Filter, FiltersProps } from '../../models/filters';
import { FC, useEffect } from 'react';
import { AdvancedViewActions } from '../../models/actions';
import MultiDatasetFilters from './MultiDatasetFilters/MultiDatasetFilters';
import { useConversationViewFeatureToggles } from '../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewStyles } from '../../context/ConversationViewStylesContext';

interface Props {
  filtersProps: FiltersProps;
  actions: AdvancedViewActions;
  attachments: Attachment[];
  attachmentsDataQuery?: DataQuery;
  dataQueries?: DataQuery[];
  dimensions?: Dimension[];
  locale?: string;
  isDataLoading?: boolean;
  setIsFiltering?: (isFiltering: boolean) => void;
  filters?: DatasetQueryFilters;
  onFiltersChange: (
    filterParams: DatasetQueryFilters,
    constraints: DataConstraints[],
    modalFilters?: Filter[],
  ) => void;
}

const DataDetails: FC<Props> = ({
  filtersProps,
  actions,
  attachments,
  attachmentsDataQuery,
  dataQueries,
  dimensions,
  locale,
  isDataLoading,
  setIsFiltering,
  filters,
  onFiltersChange,
}) => {
  const { titles, limitMessages } = useConversationViewStyles();
  const constraintAction = {
    getConstraints: actions.getConstraints,
    getAvailableHierarchies: filtersProps.actions?.getAvailableHierarchies,
    getHierarchy: filtersProps.actions?.getHierarchy,
  };
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();

  useEffect(() => {
    if (!isDataLoading) {
      setIsFiltering?.(false);
    }
  }, [isDataLoading, setIsFiltering]);

  return (
    <div className="h-full min-h-0 rounded bg-white">
      <div className="flex h-full flex-col gap-4 overflow-x-hidden">
        <div className="data-details-header flex items-center justify-between">
          <h2>{titles?.content ?? 'Content'}</h2>
          {isCrossDatasetModeOn ? (
            <MultiDatasetFilters
              attachmentsDataQuery={attachmentsDataQuery}
              dataQueries={dataQueries}
              updateDataQueries={actions?.updateDataQueries}
              locale={locale}
              actions={constraintAction}
              dimensions={dimensions}
              {...filtersProps}
              onFiltersChange={onFiltersChange}
              limitMessages={limitMessages}
            />
          ) : (
            <Filters
              attachmentsDataQuery={attachmentsDataQuery}
              dataQueries={dataQueries}
              updateDataQueries={actions?.updateDataQueries}
              locale={locale}
              actions={constraintAction}
              dimensions={dimensions}
              {...filtersProps}
              onFiltersChange={onFiltersChange}
              limitMessages={limitMessages}
            />
          )}
        </div>
        <div className="advanced-view-attachments-container min-h-0 flex-1">
          <AdvancedAttachmentRenderer
            attachments={attachments}
            currentDataQuery={attachmentsDataQuery}
            dataQueries={dataQueries}
            dimensions={dimensions}
            actions={actions}
            isShowAttachments={true}
            isDataSetAttachments={true}
            isDataLoading={isDataLoading}
            locale={locale}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
};

export default DataDetails;
