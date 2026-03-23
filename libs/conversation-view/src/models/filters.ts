import { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  DataConstraints,
  DatasetQueryFilters,
  Dimension,
  SeriesFilterDto,
  StructuralData,
  StructuralMetaData,
  StructureItemBase,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  TimeRange,
  TimeRangeOptions,
} from '@epam/statgpt-shared-toolkit';
import { LimitMessages } from '@epam/statgpt-ui-components';
import { PutOnboardingFile, UpdateConversation } from '../types/actions';
import { Conversation } from '@epam/ai-dial-shared';
import { ConversationViewTitles } from './titles';
import { StructureDataMaps } from './structure-data';

interface FilterBase {
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

export interface DatasetFilter extends FilterBase {
  filterType: 'dataset';
  datasetUrn?: string;
}

export interface SharedFilter extends FilterBase {
  filterType: 'shared';
  datasetUrn?: undefined;
}

export type Filter = DatasetFilter | SharedFilter;

export interface FilterValueSource {
  datasetUrn?: string;
  id: string;
  name?: string;
  parent?: string;
}

export interface FilterValue {
  id: string;
  name?: string;
  isSelectedValue?: boolean;
  isExpanded?: boolean;
  parent?: string;
  sourceValues?: FilterValueSource[];
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
  structureDataMaps?: StructureDataMaps;
  buttonProps?: FilterButtonProps;
  modalProps?: FiltersModalProps;
  attachmentsDataQuery?: DataQuery;
  dataQueries?: DataQuery[];
  onFiltersChange?: (
    filterParams: DatasetQueryFilters,
    constraints: DataConstraints[],
    modalFilters?: Filter[],
  ) => void;
  onMultipleDataFiltersChange?: (
    filterParamsMap: Map<string, DatasetQueryFilters>,
    constraintsMap?: Map<string, DataConstraints[] | undefined>,
    dataQueries?: DataQuery[],
  ) => void;
  locale?: string;
  timeRangeOptions?: TimeRangeOptions[];
  titles?: ConversationViewTitles;
  conversationKey: string;
  conversation?: Conversation | null;
  setConversation?: Dispatch<SetStateAction<Conversation | null>>;
  updateConversation: UpdateConversation;
  updateDataQueries?: (dataQueries?: DataQuery[]) => void;
  limitMessages?: LimitMessages;
  filterIconClassName?: string;
  datasetIcon?: ReactNode;
}
