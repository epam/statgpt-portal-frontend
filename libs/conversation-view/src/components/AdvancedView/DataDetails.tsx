'use client';

import { Attachment } from '@epam/ai-dial-shared';
import {
  DataConstraints,
  DatasetQueryFilters,
  Dimension,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { LimitMessages } from '@epam/statgpt-ui-components';
import Filters from './Filters/Filters';
import { AdvancedAttachmentRenderer } from './AdvancedAttachmentRenderer';
import { Filter, FiltersProps } from '../../models/filters';
import { FC, useEffect } from 'react';
import { AdvancedViewActions } from '../../models/actions';
import { AttachmentsStyles } from '../../models/attachments-styles';
import { ConversationViewTitles } from '../../models/titles';
import { AttachmentsConfig } from '../../models/attachments';
import MultiDatasetFilters from './MultiDatasetFilters/MultiDatasetFilters';
import { useConversationViewFeatureToggles } from '../../context/ConversationViewFeatureTogglesContext';

interface Props {
  filtersProps: FiltersProps;
  actions: AdvancedViewActions;
  attachments: Attachment[];
  attachmentsDataQuery?: DataQuery;
  dataQueries?: DataQuery[];
  dimensions?: Dimension[];
  locale?: string;
  attachmentsStyles?: AttachmentsStyles;
  isDataLoading?: boolean;
  titles?: ConversationViewTitles;
  setIsFiltering?: (isFiltering: boolean) => void;
  limitMessages?: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
  filters?: DatasetQueryFilters;
  filtersMap?: Map<string, DatasetQueryFilters>;
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
  attachmentsStyles,
  isDataLoading,
  setIsFiltering,
  titles,
  limitMessages,
  attachmentsConfig,
  filters,
  onFiltersChange,
}) => {
  const constraintAction = {
    getConstraints: actions.getConstraints,
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
              titles={titles}
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
              titles={titles}
              {...filtersProps}
              onFiltersChange={onFiltersChange}
              limitMessages={limitMessages}
            />
          )}
        </div>
        <div className="advanced-view-attachments-container min-h-0 flex-1">
          <AdvancedAttachmentRenderer
            titles={titles}
            attachments={attachments}
            attachmentsStyles={attachmentsStyles}
            currentDataQuery={attachmentsDataQuery}
            dimensions={dimensions}
            actions={actions}
            isShowAttachments={true}
            isDataSetAttachments={true}
            isDataLoading={isDataLoading}
            locale={locale}
            filters={filters}
            limitMessages={limitMessages}
            attachmentsConfig={attachmentsConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default DataDetails;
