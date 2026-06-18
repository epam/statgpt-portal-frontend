'use client';

import { FC } from 'react';
import { DimensionInfo } from '../../../models/charting';
import classNames from 'classnames';

interface Props {
  dimensionsInfo: DimensionInfo[];
  isNarrow?: boolean;
}

const ChartSidebar: FC<Props> = ({ dimensionsInfo, isNarrow }) => {
  return (
    <div
      className={classNames(
        'sidebar flex min-h-0 flex-col gap-3 overflow-auto',
        isNarrow ? 'max-h-[120px] w-full shrink-0' : 'w-[176px]',
      )}
    >
      {dimensionsInfo.map((dim) => (
        <div key={dim.title} className="flex flex-col">
          <h5 className="text-neutrals-800">{dim.title}</h5>
          <h5 className="font-bold">{dim.value}</h5>
        </div>
      ))}
    </div>
  );
};

export default ChartSidebar;
