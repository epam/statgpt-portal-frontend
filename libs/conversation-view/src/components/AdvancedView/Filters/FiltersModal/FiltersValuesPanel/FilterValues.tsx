import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { FixedSizeList as OriginalList } from 'react-window';
const List = OriginalList as unknown as React.ComponentType<any>;

import {
  FilterTreeNodeProps,
  FilterValue,
} from '@statgpt/conversation-view/src/models/filters';
import FilterTreeView from './FilterTreeView';
import AutoSizer from 'react-virtualized-auto-sizer';
import CheckboxRow from './CheckboxRow';
import { useIsMobile } from '@statgpt/ui-components/src/hooks/isMobile';

interface Props {
  filterValues?: FilterValue[];
  checkboxIcon?: ReactNode;
  isHierarchicalView?: boolean;
  isDisableValues?: boolean;
  selectFilterValue: (id: string, isSelectedValue?: boolean) => void;
  selectHierarchicalNodes: (nodes?: FilterTreeNodeProps[]) => void;
  expandHierarchicalValue?: (value?: FilterTreeNodeProps) => void;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

const ROW_HEIGHT = 24;
const MAX_MOBILE_HEIGHT = 232;

const FilterValues: FC<Props> = ({
  filterValues,
  checkboxIcon,
  isHierarchicalView,
  isDisableValues,
  selectFilterValue,
  selectHierarchicalNodes,
  expandHierarchicalValue,
}) => {
  const isMobile = useIsMobile();
  if (!filterValues) return null;
  const filtersHeight = filterValues.length * ROW_HEIGHT;
  const containerHeight =
    filtersHeight > MAX_MOBILE_HEIGHT ? MAX_MOBILE_HEIGHT : filtersHeight;
  return (
    <div
      className={classNames(
        isDisableValues && 'pointer-events-none opacity-[0.7]',
        'h-full overflow-auto',
      )}
      style={{ height: isMobile ? containerHeight + 'px' : '100%' }}
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
  );
};

export default FilterValues;
