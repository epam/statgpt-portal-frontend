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
import { getFilterValuesTree } from '../../../../../utils/filters';
import AutoSizer from 'react-virtualized-auto-sizer';
import CheckboxRow from './CheckboxRow';
import { Loader, useIsMobile } from '@epam/statgpt-ui-components';
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
  isVirtualized?: boolean;
  isScrollable?: boolean;
  isDisableValues?: boolean;
  isValuesLoading?: boolean;
  structuresMap?: Map<string, StructuralData | undefined>;
  hierarchyTreeNodes?: FilterTreeNodeProps[];
  isHierarchyLoading?: boolean;
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
  isVirtualized = true,
  isScrollable = true,
  isDisableValues,
  isValuesLoading,
  structuresMap,
  hierarchyTreeNodes,
  isHierarchyLoading,
  selectFilterValue,
  selectHierarchicalNodes,
  expandHierarchicalValue,
}) => {
  const isMobile = useIsMobile();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const isLoading = isValuesLoading || isHierarchyLoading;
  if (!filterValues && !isLoading) return null;
  const values = filterValues ?? [];
  const datasetName = selectedFilter
    ? getDatasetNameFromFilters(selectedFilter, structuresMap)
    : void 0;
  const isSingleDatasetInModal = structuresMap?.size === 1;
  const shouldShowHeader =
    isCrossDatasetModeOn &&
    selectedFilter?.filterType !== 'shared' &&
    !!selectedFilter?.title &&
    (isSingleDatasetInModal || !!datasetName);
  const filtersHeight = values.length * ROW_HEIGHT;
  const containerHeight =
    filtersHeight > MAX_MOBILE_HEIGHT ? MAX_MOBILE_HEIGHT : filtersHeight;

  return (
    <div
      className={classNames(
        'relative',
        isDisableValues && 'pointer-events-none opacity-[0.7]',
        isScrollable ? 'flex h-full min-h-0 flex-col' : 'flex flex-col',
      )}
    >
      {shouldShowHeader && (
        <div className="mb-2 flex items-center gap-x-1">
          {!isSingleDatasetInModal && (
            <>
              <DatasetIcon className="size-4 shrink-0 text-neutrals-700" />
              <span className="h4 text-neutrals-800">{datasetName}</span>
              <ChevronRightIcon className="size-4 shrink-0 text-neutrals-1000" />
            </>
          )}
          <span className="h4 text-neutrals-1000">{selectedFilter?.title}</span>
        </div>
      )}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-10 min-h-12">
          <Loader />
        </div>
      )}
      <div
        className={classNames(
          isScrollable ? 'min-h-0 flex-1 overflow-auto' : 'overflow-visible',
          isLoading && 'pointer-events-none opacity-[0.7]',
        )}
        style={
          isScrollable && isMobile && !isLoading
            ? { height: `${containerHeight}px` }
            : undefined
        }
      >
        {hierarchyTreeNodes?.length || isHierarchicalView ? (
          <FilterTreeView
            treeNodes={hierarchyTreeNodes ?? getFilterValuesTree(values)}
            checkboxIcon={checkboxIcon}
            selectFilterValue={selectFilterValue}
            selectHierarchicalNodes={selectHierarchicalNodes}
            expandHierarchicalValue={expandHierarchicalValue}
          />
        ) : !isVirtualized ? (
          <div className="flex flex-col gap-y-1">
            {values.map((filterValue) => (
              <CheckboxRow
                key={filterValue.id}
                filterValue={filterValue}
                checkboxIcon={checkboxIcon}
                selectFilterValue={selectFilterValue}
              />
            ))}
          </div>
        ) : (
          <AutoSizer>
            {({ width, height }) => (
              <List
                itemCount={values.length}
                itemSize={ROW_HEIGHT}
                width={width}
                height={height}
              >
                {({ index, style }: RowProps) => (
                  <CheckboxRow
                    style={style}
                    filterValue={values[index]}
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
