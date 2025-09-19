'use client';

import { CustomChartAttachmentType } from '../../../models/attachments';
import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';
import ReactECharts from 'echarts-for-react';
import { ChartUnit } from '../../../models/charting';
import { ChartingIcon } from '../../../types/charting-icon';
import ChartSidebar from './ChartSidebar';
import Slider from './Slider';
import ChartLimitationInfo from './ChartLimitationInfo';
import classNames from 'classnames';
import { ConversationViewTitles } from '../../../models/titles';

interface Props {
  attachment: CustomChartAttachmentType;
  icons?: Record<ChartingIcon, ReactNode>;
  openAdvancedView?: () => void;
  fixHeight?: boolean;
  titles?: ConversationViewTitles;
}

const CustomChartAttachment: FC<Props> = ({
  attachment,
  icons,
  openAdvancedView,
  fixHeight = true,
  titles,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [units, setUnits] = useState<ChartUnit[]>([]);
  const [chartIndex, setChartIndex] = useState<number>(0);
  const [selectedUnit, setSelectedUnit] = useState<ChartUnit | undefined>(
    void 0,
  );

  useEffect(() => {
    setIsLoading(attachment.charting_data == null);
    setUnits(attachment.charting_data?.units || []);
  }, [attachment.charting_data]);

  useEffect(() => {
    setSelectedUnit(
      !isLoading && units.length > 0 ? units[chartIndex] : void 0,
    );
  }, [isLoading, units, chartIndex]);

  const nextChart = useCallback(() => {
    setChartIndex((prevV) => Math.min(prevV + 1, units.length - 1));
  }, [units]);

  const prevChart = useCallback(() => {
    setChartIndex((prevV) => Math.max(prevV - 1, 0));
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="chart-attachment w-full h-full">
      {attachment.charting_data && (
        <div className="flex flex-col w-full h-full gap-4">
          {units.length == 0 || selectedUnit == null ? (
            <h4 className="ml-1">{titles?.chartInfo || 'No data'}</h4>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h3 className="chart-attachment-title">
                  {titles?.chart || 'Chart'} {chartIndex + 1}/{units.length}
                </h3>
                <h4 className="text-neutrals-700">
                  {titles?.chartInfo || 'Chart Information'}
                </h4>
              </div>
              <div
                className={classNames(
                  'chart-area overflow-hidden flex flex-row gap-4 h-full ',
                  fixHeight && 'max-h-[400px] min-h-[400px]',
                  !fixHeight && 'min-h-[300px]',
                )}
              >
                <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4">
                  <ReactECharts
                    option={selectedUnit.config}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                  {selectedUnit.limitedByRowsAmountTo && (
                    <ChartLimitationInfo
                      limitAmount={selectedUnit.limitedByRowsAmountTo}
                      openAdvancedView={openAdvancedView}
                      titles={titles}
                    ></ChartLimitationInfo>
                  )}
                  {units.length > 1 && (
                    <Slider
                      icons={icons}
                      currentIndex={chartIndex}
                      totalCount={units.length}
                      onNext={nextChart}
                      onPrev={prevChart}
                    ></Slider>
                  )}
                </div>
                <ChartSidebar
                  dimensionsInfo={selectedUnit.dimensions}
                ></ChartSidebar>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomChartAttachment;
