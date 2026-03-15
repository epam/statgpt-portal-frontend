'use client';

import { forwardRef, ReactNode } from 'react';
import classNames from 'classnames';

interface Props {
  fixHeight?: boolean;
  gridHeight: number;
  children: ReactNode;
}

const GridContainer = forwardRef<HTMLDivElement, Props>(
  ({ fixHeight, gridHeight, children }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames(
          'ag-theme-quartz w-full min-h-[80px]',
          fixHeight ? 'max-h-[400px]' : 'max-h-full',
        )}
        style={{ height: gridHeight }}
      >
        {children}
      </div>
    );
  },
);

export default GridContainer;
