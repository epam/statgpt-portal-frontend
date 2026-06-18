'use client';

import { FC, Ref, ReactNode } from 'react';
import classNames from 'classnames';

interface Props {
  ref?: Ref<HTMLDivElement>;
  fixHeight?: boolean;
  fillHeight?: boolean;
  gridHeight: number;
  children: ReactNode;
}

const GridContainer: FC<Props> = ({
  ref,
  fixHeight,
  fillHeight,
  gridHeight,
  children,
}) => {
  return (
    <div
      ref={ref}
      className={classNames(
        'ag-theme-quartz w-full min-h-[80px]',
        fillHeight && 'h-full',
        !fillHeight && fixHeight && 'max-h-[400px]',
        !fillHeight && !fixHeight && 'max-h-full',
      )}
      style={fillHeight ? undefined : { height: gridHeight }}
    >
      {children}
    </div>
  );
};

export default GridContainer;
