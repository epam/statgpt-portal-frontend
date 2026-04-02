'use client';

import { FC, ReactNode } from 'react';
import { FilterTreeNodeProps } from '../../../../../models/filters';
import FilterTreeNode from './FilterTreeNode';

interface Props {
  treeNodes?: FilterTreeNodeProps[];
  checkboxIcon?: ReactNode;
  selectFilterValue?: (id: string, isSelectedValue?: boolean) => void;
  selectHierarchicalNodes: (nodes?: FilterTreeNodeProps[]) => void;
  expandHierarchicalValue?: (value?: FilterTreeNodeProps) => void;
}

const FilterTreeView: FC<Props> = ({
  treeNodes,
  checkboxIcon,
  selectFilterValue,
  selectHierarchicalNodes,
  expandHierarchicalValue,
}) => {
  return (
    <>
      {treeNodes?.map((node) => (
        <FilterTreeNode
          key={node?.id}
          node={node}
          checkboxIcon={checkboxIcon}
          selectFilterValue={selectFilterValue}
          selectHierarchicalNodes={selectHierarchicalNodes}
          expandHierarchicalValue={expandHierarchicalValue}
        />
      ))}
    </>
  );
};

export default FilterTreeView;
