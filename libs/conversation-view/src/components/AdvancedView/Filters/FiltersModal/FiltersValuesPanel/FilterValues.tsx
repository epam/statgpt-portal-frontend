'use client';

import React, { ComponentType, CSSProperties, FC, ReactNode } from 'react';
import classNames from 'classnames';
import { FixedSizeList as OriginalList } from 'react-window';
const List = OriginalList as unknown as ComponentType<any>;

import {
  Filter,
  FilterTreeNodeProps,
  FilterValue,
} from '../../../../../models/filters';
import FilterTreeView from './FilterTreeView';
import AutoSizer from 'react-virtualized-auto-sizer';
import CheckboxRow from './CheckboxRow';
import { useIsMobile } from '@epam/statgpt-ui-components';
import { StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { useConversationViewFeatureToggles } from '../../../../../context/ConversationViewFeatureTogglesContext';
import { getDatasetNameFromFilters } from '../../../../../utils/multiple-filters';
import DatasetIcon from '../../../../../assets/icons/dataset.svg';
import ChevronRightIcon from '../../../../../assets/icons/chevron-right.svg';

interface Props {
  selectedFilter?: Filter;
  filterValues?: FilterValue[];
  checkboxIcon?: ReactNode;
  isHierarchicalView?: boolean;
  isDisableValues?: boolean;
  structuresMap?: Map<string, StructuralData | undefined>;
  selectFilterValue: (id: string, isSelectedValue?: boolean) => void;
  selectHierarchicalNodes: (nodes?: FilterTreeNodeProps[]) => void;
  expandHierarchicalValue?: (value?: FilterTreeNodeProps) => void;
}

interface RowProps {
  index: number;
  style: CSSProperties;
}

const ROW_HEIGHT = 24;
const MAX_MOBILE_HEIGHT = 232;

const FilterValues: FC<Props> = ({
  selectedFilter,
  filterValues,
  checkboxIcon,
  isHierarchicalView,
  isDisableValues,
  structuresMap,
  selectFilterValue,
  selectHierarchicalNodes,
  expandHierarchicalValue,
}) => {
  const isMobile = useIsMobile();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  if (!filterValues) return null;
  const datasetName = selectedFilter
    ? getDatasetNameFromFilters(selectedFilter, structuresMap)
    : void 0;
  const shouldShowHeader =
    isCrossDatasetModeOn &&
    selectedFilter?.filterType !== 'shared' &&
    !!datasetName &&
    !!selectedFilter?.title;
  const filtersHeight = filterValues.length * ROW_HEIGHT;
  const containerHeight =
    filtersHeight > MAX_MOBILE_HEIGHT ? MAX_MOBILE_HEIGHT : filtersHeight;
  return (
    <div
      className={classNames(
        isDisableValues && 'pointer-events-none opacity-[0.7]',
        'flex h-full min-h-0 flex-col',
      )}
    >
      {shouldShowHeader && (
        <div className="mb-2 flex items-center gap-x-2">
          <DatasetIcon className="size-4 shrink-0 text-neutrals-700" />
          <span className="h4 text-neutrals-800">{datasetName}</span>
          <ChevronRightIcon className="size-4 shrink-0 text-neutrals-1000" />
          <span className="h4 text-neutrals-1000">{selectedFilter?.title}</span>
        </div>
      )}
      <div
        className="min-h-0 flex-1 overflow-auto"
        style={{ height: isMobile ? `${containerHeight}px` : undefined }}
      >
        {isHierarchicalView ? (
          <FilterTreeView
            filterValues={filterValues}
            checkboxIcon={checkboxIcon}
            selectFilterValue={selectFilterValue}
            selectHierarchicalNodes={selectHierarchicalNodes}
            expandHierarchicalValue={expandHierarchicalValue}
          />
        ) : (
          <AutoSizer>
            {({ width, height }) => (
              <List
                itemCount={filterValues.length}
                itemSize={ROW_HEIGHT}
                width={width}
                height={height}
              >
                {({ index, style }: RowProps) => (
                  <CheckboxRow
                    index={index}
                    style={style}
                    filterValue={filterValues[index]}
                    checkboxIcon={checkboxIcon}
                    selectFilterValue={selectFilterValue}
                  />
                )}
              </List>
            )}
          </AutoSizer>
        )}
      </div>
    </div>
  );
};

export default FilterValues;
