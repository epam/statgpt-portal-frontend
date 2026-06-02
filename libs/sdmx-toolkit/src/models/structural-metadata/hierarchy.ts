import { CommonArtefactProperty } from './common-artefact-properties';
import { ElementBase } from './structural-metadata-base';

export interface HierarchicalCode extends ElementBase {
  code: string;
  hierarchicalCodes?: HierarchicalCode[];
  level?: number;
  parent?: string;
}

export interface Hierarchy extends CommonArtefactProperty {
  hierarchicalCodes?: HierarchicalCode[];
}

export interface CodelistItemBase extends ElementBase {
  parent?: string;
  code?: string;
}

export interface CodelistData extends CommonArtefactProperty {
  codes?: CodelistItemBase[];
}

export interface TreeNode<T> {
  id?: string;
  name?: string;
  children: TreeNode<T>[];
  isExpanded?: boolean;
  disabled?: boolean;
  /**
   * Whether the node corresponds to a real, selectable code from the dimension's
   * own codelist (as opposed to a purely structural grouping node that only
   * exists in the hierarchy and cannot be persisted as a value on its own).
   */
  isSelectableValue?: boolean;
  parent?: string;
  metadata: T;
}
