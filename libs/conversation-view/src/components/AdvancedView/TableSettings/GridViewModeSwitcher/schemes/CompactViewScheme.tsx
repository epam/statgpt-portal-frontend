import { COMPACT_GRID_STYLE } from './constants';
import {
  ViewSchemeCellEmphasis,
  ViewSchemeCellRole,
  type ViewSchemeCell,
} from './types';
import { ViewSchemeGrid } from './ViewSchemeGrid';

const COMPACT_ROWS: ViewSchemeCell[][] = [
  [
    {
      role: ViewSchemeCellRole.Header,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'D1.D2.D3',
    },
    {
      role: ViewSchemeCellRole.Header,
      emphasis: ViewSchemeCellEmphasis.Default,
    },
    {
      role: ViewSchemeCellRole.Header,
      emphasis: ViewSchemeCellEmphasis.Default,
    },
  ],
  [
    {
      role: ViewSchemeCellRole.Cell,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'C1.A',
    },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Default },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Default },
  ],
  [
    {
      role: ViewSchemeCellRole.Cell,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'C1.B',
    },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Default },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Default },
  ],
  [
    {
      role: ViewSchemeCellRole.Cell,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'C2.X',
    },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Default },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Default },
  ],
];

export const CompactViewScheme = () => (
  <ViewSchemeGrid rows={COMPACT_ROWS} style={COMPACT_GRID_STYLE} />
);
