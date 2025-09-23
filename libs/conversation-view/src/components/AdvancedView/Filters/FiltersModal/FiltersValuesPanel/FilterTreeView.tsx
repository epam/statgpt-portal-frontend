'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import {
  FilterTreeNodeProps,
  FilterValue,
} from '../../../../../models/filters';
import FilterTreeNode from './FilterTreeNode';
import { getFilterValuesTree } from '../../../../../utils/filters';

interface Props {
  filterValues?: FilterValue[];
  checkboxIcon?: ReactNode;
  selectFilterValue?: (id: string, isSelectedValue?: boolean) => void;
  selectHierarchicalNodes: (nodes?: FilterTreeNodeProps[]) => void;
  expandHierarchicalValue?: (value?: FilterValue) => void;
}

const FilterTreeView: FC<Props> = ({
  filterValues,
  checkboxIcon,
  selectFilterValue,
  selectHierarchicalNodes,
  expandHierarchicalValue,
}) => {
  const [filterTreeNodes, setFilterTreeNodes] = useState<FilterTreeNodeProps[]>(
    [],
  );

  useEffect(() => {
    setFilterTreeNodes(getFilterValuesTree(filterValues));
  }, [filterValues]);

  return filterTreeNodes?.map((node) => (
    <FilterTreeNode
      key={node?.id}
      node={node}
      checkboxIcon={checkboxIcon}
      selectFilterValue={selectFilterValue}
      selectHierarchicalNodes={selectHierarchicalNodes}
      expandHierarchicalValue={expandHierarchicalValue}
    />
  ));
};

export default FilterTreeView;
