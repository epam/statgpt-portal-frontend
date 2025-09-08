'use client';

import { FC } from 'react';
import { DimensionInfo } from '@statgpt/conversation-view/src/models/charting';

interface Props {
  dimensionsInfo: DimensionInfo[];
}

const ChartSidebar: FC<Props> = ({ dimensionsInfo }) => {
  return (
    <div className="sidebar flex flex-col w-[176px] gap-3 min-h-0 overflow-auto">
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
