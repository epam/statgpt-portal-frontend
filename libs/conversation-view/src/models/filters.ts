import { Dispatch, ReactNode, SetStateAction } from 'react';
import { PutOnboardingFile, UpdateConversation } from '../types/actions';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import {
  StructuralData,
  StructuralMetaData,
} from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { StructureItemBase } from '@statgpt/sdmx-toolkit/src/models/data/structure';
import { Conversation } from '@epam/ai-dial-shared';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { TimeRangeOptions } from '@statgpt/shared-toolkit/src/models/time-range';
import { TimeRange } from '@statgpt/shared-toolkit/src/models/time-range';
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
  resetIcon?: ReactNode;
}

export interface FiltersProps {
  actions?: {
    getConstraints: (
      urn: string,
      filters?: SeriesFilterDto[],
    ) => Promise<StructuralMetaData>;
    putOnboardingFile?: PutOnboardingFile;
  };
  dimensions?: Dimension[];
  structureDimensions?: StructureItemBase[];
  structures?: StructuralData;
  initialConstraints?: DataConstraints[];
  buttonProps?: FilterButtonProps;
  modalProps?: FiltersModalProps;
  attachmentsDataQuery?: DataQuery;
  dataQueries?: DataQuery[];
  onFiltersChange?: (
    filterParams: DatasetQueryFilters,
    constraints: DataConstraints[],
    modalFilters?: Filter[],
  ) => void;
  locale?: string;
  timeRangeOptions?: TimeRangeOptions[];
  titles?: ConversationViewTitles;
  conversationKey: string;
  conversation?: Conversation | null;
  setConversation?: Dispatch<SetStateAction<Conversation | null>>;
  updateConversation: UpdateConversation;
  updateDataQueries?: (dataQueries?: DataQuery[]) => void;
}
