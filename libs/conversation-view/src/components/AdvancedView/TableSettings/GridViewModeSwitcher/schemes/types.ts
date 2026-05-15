import { type ReactNode } from 'react';

export enum ViewSchemeCellRole {
  Header = 'header',
  Cell = 'cell',
}

export enum ViewSchemeCellEmphasis {
  Focus = 'focus',
  Default = 'default',
}

export interface ViewSchemeCell {
  role: ViewSchemeCellRole;
  emphasis: ViewSchemeCellEmphasis;
  label?: ReactNode;
}
