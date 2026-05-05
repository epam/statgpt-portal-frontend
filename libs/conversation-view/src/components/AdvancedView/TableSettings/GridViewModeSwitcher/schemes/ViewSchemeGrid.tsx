import { Fragment, type CSSProperties } from 'react';
import { mergeClasses } from '../../../../../../src/utils/mergeClasses';
import { CELL_CLASS_BY_ROLE_AND_EMPHASIS, SCHEME_GRID_CLASS } from './constants';
import { type ViewSchemeCell } from './types';

type ViewSchemeGridProps = {
  rows: ViewSchemeCell[][];
  style: CSSProperties;
};

export const ViewSchemeGrid = ({ rows, style }: ViewSchemeGridProps) => (
  <div className={SCHEME_GRID_CLASS} style={style}>
    {rows.map((row, rowIndex) => (
      <Fragment key={rowIndex}>
        {row.map((cell, colIndex) => (
          <span
            key={`${rowIndex}-${colIndex}`}
            className={mergeClasses([
              CELL_CLASS_BY_ROLE_AND_EMPHASIS[cell.role][cell.emphasis],
              !cell.label && 'text-transparent',
            ])}
          >
            {cell.label || ' '}
          </span>
        ))}
      </Fragment>
    ))}
  </div>
);
