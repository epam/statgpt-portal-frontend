export interface HierarchicalCode {
  code: string;
  hierarchicalCodes?: HierarchicalCode[];
  level?: number;
  parent?: string;
}

export interface Hierarchy {
  id: string;
  agencyID: string;
  version: string;
  name?: string;
  description?: string;
  hierarchicalCodes?: HierarchicalCode[];
}

export interface GlossaryElementBase {
  id: string;
  name?: string;
  description?: string;
  parent?: string;
  code?: string;
}

export interface Glossary {
  id: string;
  agencyID: string;
  version: string;
  name?: string;
  terms?: GlossaryElementBase[];
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
