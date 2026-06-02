'use client';

import { FC, ReactNode, useId } from 'react';
import { FilterTreeNodeProps } from '../../../../../models/filters';
import ChevronSolidDownIcon from '../../../../../assets/icons/chevron-solid-down.svg';
import ChevronSolidRightIcon from '../../../../../assets/icons/chevron-solid-right.svg';
import { Checkbox } from '@epam/statgpt-ui-components';
import {
  getFilterNodesBySelection,
  getFilterTreeNodePadding,
  hasSelectedDescendant,
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
  const isIndeterminate =
    isHasChildren && !node.isSelectedValue && hasSelectedDescendant(node);
  const nodeIconClasses = 'cursor-pointer text-neutrals-1000 w-6 h-6 shrink-0';

  // A hierarchy code can appear at several positions in the tree.
  // Give each rendered checkbox a DOM-unique id so the label/input
  // association never binds to another node's input.
  const checkboxId = useId();

  const onSelectFilterValue = (
    _checkboxId: string,
    isSelectedValue?: boolean,
  ) => {
    if (node?.children?.length) {
      const hasEnabledChildren = node.children.some((child) => !child.disabled);
      if (hasEnabledChildren) {
        selectHierarchicalNodes?.(getFilterNodesBySelection(node));
      } else {
        // Node has children but all are disabled — treat as a selectable leaf
        // and pass via selectHierarchicalNodes so the handler can add it to
        // dimensionValues if it isn't already present (e.g. hierarchy-only codes).
        selectHierarchicalNodes?.([{ ...node, isSelectedValue }]);
      }
    } else {
      selectFilterValue?.(node.id, isSelectedValue);
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
          id={checkboxId}
          label={node?.name}
          checked={!!node.isSelectedValue}
          indeterminate={isIndeterminate}
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
