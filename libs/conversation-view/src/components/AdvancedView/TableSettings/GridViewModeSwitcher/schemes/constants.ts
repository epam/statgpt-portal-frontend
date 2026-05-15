import { type CSSProperties } from 'react';
import { ViewSchemeCellEmphasis, ViewSchemeCellRole } from './types';

export const SCHEME_GRID_CLASS = 'grid gap-1';

export const COMPACT_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: '44px 23px 23px',
  gridTemplateRows: 'repeat(4, 14px)',
};

export const EXTENDED_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: 'repeat(4, 21.5px)',
  gridTemplateRows: 'repeat(4, 14px)',
};

export const CELL_CLASS_BY_ROLE_AND_EMPHASIS: Record<
  ViewSchemeCellRole,
  Record<ViewSchemeCellEmphasis, string>
> = {
  [ViewSchemeCellRole.Header]: {
    [ViewSchemeCellEmphasis.Focus]:
      'content-center rounded-sm border border-accent-300 bg-accent-300 text-center text-[8px] font-semibold',
    [ViewSchemeCellEmphasis.Default]:
      'rounded-sm bg-semantic-warning border border-accent-300',
  },
  [ViewSchemeCellRole.Cell]: {
    [ViewSchemeCellEmphasis.Focus]:
      'content-center rounded-sm border border-accent-300 bg-hues-100 pl-1 text-left text-[8px] font-semibold',
    [ViewSchemeCellEmphasis.Default]:
      'rounded-sm bg-neutrals-100 border border-accent-300',
  },
};
