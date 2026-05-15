import { EXTENDED_GRID_STYLE } from './constants';
import {
  ViewSchemeCellEmphasis,
  ViewSchemeCellRole,
  type ViewSchemeCell,
} from './types';
import { ViewSchemeGrid } from './ViewSchemeGrid';

const EXTENDED_ROWS: ViewSchemeCell[][] = [
  [
    {
      role: ViewSchemeCellRole.Header,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'D1',
    },
    {
      role: ViewSchemeCellRole.Header,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'D2',
    },
    {
      role: ViewSchemeCellRole.Header,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'D3',
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
      label: 'C1',
    },
    {
      role: ViewSchemeCellRole.Cell,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'A',
    },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Focus },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Default },
  ],
  [
    {
      role: ViewSchemeCellRole.Cell,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'C1',
    },
    {
      role: ViewSchemeCellRole.Cell,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'B',
    },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Focus },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Default },
  ],
  [
    {
      role: ViewSchemeCellRole.Cell,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'C2',
    },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Focus },
    {
      role: ViewSchemeCellRole.Cell,
      emphasis: ViewSchemeCellEmphasis.Focus,
      label: 'X',
    },
    { role: ViewSchemeCellRole.Cell, emphasis: ViewSchemeCellEmphasis.Default },
  ],
];

export const ExtendedViewScheme = () => (
  <ViewSchemeGrid rows={EXTENDED_ROWS} style={EXTENDED_GRID_STYLE} />
);
