'use client';

import { Attachment } from '@epam/ai-dial-shared';
import {
  DataConstraints,
  DatasetQueryFilters,
  Dimension,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { FC, useEffect, useState } from 'react';
import { AdvancedViewActions } from '../../models/actions';
import { AttachmentsStyles } from '../../models/attachments-styles';
import { Filter, FiltersProps } from '../../models/filters';
import { ConversationViewTitles } from '../../models/titles';
import AttachmentRenderer from '../Attachments/AttachmentRenderer';
import Filters from './Filters/Filters';

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
}) => {
  const [filters, setFilters] = useState<DatasetQueryFilters>({
    filterKey: null,
    timeFilter: null,
  });
  const constraintAction = {
    getConstraints: actions.getConstraints,
  };

  const onFiltersChange = (
    filterParams: DatasetQueryFilters,
    constraints: DataConstraints[],
    modalFilters?: Filter[],
  ) => {
    setFilters(filterParams);
    setIsFiltering?.(true);
    if (filtersProps && filtersProps.onFiltersChange) {
      filtersProps?.onFiltersChange(filterParams, constraints, modalFilters);
    }
  };

  useEffect(() => {
    if (!isDataLoading) {
      setIsFiltering?.(false);
    }
  }, [isDataLoading, setIsFiltering]);

  return (
    <div className="bg-white rounded h-full min-h-0">
      <div className="flex flex-col gap-4 h-full overflow-x-hidden">
        <div className="data-details-header flex justify-between items-center">
          <h2>{titles?.content ?? 'Content'}</h2>
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
          />
        </div>
        <div className="advanced-view-attachments-container flex-1 min-h-0">
          <AttachmentRenderer
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
          />
        </div>
      </div>
    </div>
  );
};

export default DataDetails;
