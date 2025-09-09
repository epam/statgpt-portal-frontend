import { FC, ReactNode, useEffect, useState } from 'react';
import { FilterTreeNodeProps } from '@statgpt/conversation-view/src/models/filters';
import ChevronSolidDownIcon from '@statgpt/conversation-view/src/assets/icons/chevron-solid-down.svg';
import ChevronSolidRightIcon from '@statgpt/conversation-view/src/assets/icons/chevron-solid-right.svg';
import { Checkbox } from '@statgpt/ui-components/src/components/Checkbox/Checkbox';
import {
  getFilterNodesBySelection,
  getFilterTreeNodePadding,
} from '@statgpt/conversation-view/src/utils/filters';

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
  const [isHasChildren, setIsHasChildren] = useState<boolean>(false);
  const nodeIconClasses = 'cursor-pointer text-neutrals-1000 w-6 h-6 shrink-0';

  useEffect(() => {
    setIsHasChildren(!!node?.children?.length);
  }, [node]);

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
