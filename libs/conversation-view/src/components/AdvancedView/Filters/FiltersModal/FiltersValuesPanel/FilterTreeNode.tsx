'use client';

import { FC, ReactNode } from 'react';
import { FilterTreeNodeProps } from '../../../../../models/filters';
import ChevronSolidDownIcon from '../../../../../assets/icons/chevron-solid-down.svg';
import ChevronSolidRightIcon from '../../../../../assets/icons/chevron-solid-right.svg';
import { Checkbox } from '@epam/statgpt-ui-components';
import {
  getFilterNodesBySelection,
  getFilterTreeNodePadding,
} from '../../../../../utils/filters';

interface Props {
  node: FilterTreeNodeProps;
  level?: number;
  checkboxIcon?: ReactNode;
  selectFilterValue?: (id: string, isSelectedValue?: boolean) => void;
  selectHierarchicalNodes: (nodes?: FilterTreeNodeProps[]) => void;
  expandHierarchicalValue?: (value?: FilterTreeNodeProps) => void;
}

const FilterTreeNode: FC<Props> = ({
  node,
  level = 1,
  checkboxIcon,
  selectFilterValue,
  selectHierarchicalNodes,
  expandHierarchicalValue,
}) => {
  const isHasChildren = !!node?.children?.length;
  const nodeIconClasses = 'cursor-pointer text-neutrals-1000 w-6 h-6 shrink-0';

  const onSelectFilterValue = (id: string, isSelectedValue?: boolean) => {
    if (node?.children?.length) {
      selectHierarchicalNodes?.(getFilterNodesBySelection(node));
    } else {
      selectFilterValue?.(id, isSelectedValue);
    }
  };

  return (
    <div className="flex flex-col" key={node?.id}>
      <div
        className="flex items-center"
        style={{
          paddingLeft: getFilterTreeNodePadding(level, isHasChildren),
        }}
      >
        {isHasChildren &&
          (node?.isExpanded ? (
            <ChevronSolidRightIcon
              className={nodeIconClasses}
              onClick={() => expandHierarchicalValue?.(node)}
            />
          ) : (
            <ChevronSolidDownIcon
              className={nodeIconClasses}
              onClick={() => expandHierarchicalValue?.(node)}
            />
          ))}
        <Checkbox
          id={node?.id}
          label={node?.name}
          checked={!!node.isSelectedValue}
          checkboxIcon={checkboxIcon}
          disabled={node?.disabled}
          onChange={onSelectFilterValue}
        />
      </div>
      {isHasChildren && node?.isExpanded && (
        <>
          {node?.children?.map((child) => (
            <FilterTreeNode
              key={child?.id}
              node={child}
              level={level + 1}
              checkboxIcon={checkboxIcon}
              selectFilterValue={selectFilterValue}
              selectHierarchicalNodes={selectHierarchicalNodes}
              expandHierarchicalValue={expandHierarchicalValue}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default FilterTreeNode;
