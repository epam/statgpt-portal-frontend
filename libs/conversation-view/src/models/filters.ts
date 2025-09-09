import { ReactNode } from 'react';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import {
  StructuralData,
  StructuralMetaData,
} from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { StructureItemBase } from '@statgpt/sdmx-toolkit/src/models/data/structure';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import {
  TimeRange,
  TimeRangeOptions,
} from '@statgpt/shared-toolkit/src/models/time-range';
import { DataConstraints } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/constraints';
import { SeriesFilterDto } from '@statgpt/sdmx-toolkit/src/models/series-filter';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';
import { ConversationViewTitles } from './titles';

export interface Filter {
  id?: string;
  title?: string;
  dimensionValues?: FilterValue[];
  isSelectedFilter?: boolean;
  isTimeDimension?: boolean;
  timeRange?: TimeRange;
  isHierarchical?: boolean;
  isDisabled?: boolean;
  displayMode?: string;
}

export interface FilterValue {
  id: string;
  name?: string;
  isSelectedValue?: boolean;
  isExpanded?: boolean;
  parent?: string;
}

export interface FilterTreeNodeProps extends FilterValue {
  children?: FilterTreeNodeProps[];
  level?: number;
}

export interface FilterButtonProps {
  title?: string;
  isShowBadge?: boolean;
}

export interface FilterValuesProps {
  searchIconSize?: number;
  checkboxIcon?: ReactNode;
  radioIcon?: ReactNode;
  calendarIcon?: ReactNode;
  dateFormat?: string;
}

export interface FiltersModalProps {
  isShowDividers?: boolean;
  isHideFacetCounterByDefault?: boolean;
  isShowTimeSeriesCount?: boolean;
  isShowClearIcon?: boolean;
  isShowCancelButton?: boolean;
  filterValuesProps?: FilterValuesProps;
}

export interface FiltersProps {
  actions?: {
    getConstraints: (
      urn: string,
      filters?: SeriesFilterDto[],
    ) => Promise<StructuralMetaData>;
  };
  dimensions?: Dimension[];
  structureDimensions?: StructureItemBase[];
  structures?: StructuralData;
  initialConstraints?: DataConstraints[];
  buttonProps?: FilterButtonProps;
  modalProps?: FiltersModalProps;
  attachmentsDataQuery?: DataQuery;
  onFiltersChange?: (filterParams: DatasetQueryFilters) => void;
  locale?: string;
  timeRangeOptions?: TimeRangeOptions[];
  titles?: ConversationViewTitles;
}
