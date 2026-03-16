'use client';

import { FC, Ref, ReactNode } from 'react';
import classNames from 'classnames';

interface Props {
  ref?: Ref<HTMLDivElement>;
  fixHeight?: boolean;
  gridHeight: number;
  children: ReactNode;
}

const GridContainer: FC<Props> = ({ ref, fixHeight, gridHeight, children }) => {
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
};

export default GridContainer;
