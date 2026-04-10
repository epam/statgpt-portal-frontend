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
  parent?: string;
  metadata: T;
}
