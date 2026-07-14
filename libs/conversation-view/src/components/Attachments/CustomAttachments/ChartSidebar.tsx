'use client';

import { FC } from 'react';
import { DimensionInfo } from '../../../models/charting';
import { mergeClasses } from '../../../utils/mergeClasses';

interface Props {
  dimensionsInfo: DimensionInfo[];
  isNarrow?: boolean;
  className?: string;
}

const ChartSidebar: FC<Props> = ({ dimensionsInfo, isNarrow, className }) => {
  return (
    <div
      className={mergeClasses(
        'sidebar flex min-h-0 flex-col gap-3 overflow-auto',
        isNarrow ? 'max-h-[120px] w-full shrink-0' : 'w-[176px]',
        className,
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
