'use client';

import { CustomChartAttachmentType } from '../../../models/attachments';
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Loader } from '@epam/statgpt-ui-components';
import { ChartUnit } from '../../../models/charting';
import { ChartingIcon } from '../../../types/charting-icon';
import ChartSidebar from './ChartSidebar';
import Slider from './Slider';
import ChartLimitationInfo from './ChartLimitationInfo';
import classNames from 'classnames';
import { ConversationViewTitles } from '../../../models/titles';
import { useOnboarding } from '../../../context/OnboardingContext';
import {
  getOnboardingInfoForAdvancedView,
  getOnboardingInfoForChartsView,
  isShowChartsOnboarding,
} from '../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../constants/onboarding-elements';
import ResponsiveEChart from './ResponsiveChart';
import DatasetIcon from '../../../assets/icons/dataset.svg';

interface Props {
  attachment: CustomChartAttachmentType;
  icons?: Record<ChartingIcon, ReactNode>;
  openAdvancedView?: () => void;
  isDataLoading?: boolean;
  fixHeight?: boolean;
  titles?: ConversationViewTitles;
}

interface FlatChartUnit {
  unit: ChartUnit;
  groupTitle?: string;
}

const CustomChartAttachment: FC<Props> = ({
  attachment,
  icons,
  isDataLoading,
  openAdvancedView,
  fixHeight = true,
  titles,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [flatUnits, setFlatUnits] = useState<FlatChartUnit[]>([]);
  const [chartIndex, setChartIndex] = useState<number>(0);
  const [selectedUnit, setSelectedUnit] = useState<ChartUnit | undefined>(
    void 0,
  );
  const [selectedGroupTitle, setSelectedGroupTitle] = useState<string>();
  const { onboardingFileSchema, isShowOnboarding, setOnboardingFileSchema } =
    useOnboarding();
  const chartAttachmentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsLoading(attachment.charting_data == null);
    const groups = attachment.charting_data?.groups ?? [];
    const units = attachment.charting_data?.units ?? [];
    setFlatUnits(
      groups.length > 0
        ? groups.flatMap((group) =>
            group.units.map((unit) => ({ unit, groupTitle: group.title })),
          )
        : units.map((unit) => ({ unit })),
    );
  }, [attachment.charting_data]);

  useEffect(() => {
    const isChartIndexInRange = flatUnits.length > chartIndex;
    const currentFlatUnit = isChartIndexInRange
      ? flatUnits[chartIndex]
      : flatUnits[0];

    setSelectedUnit(
      !isLoading && currentFlatUnit != null ? currentFlatUnit.unit : void 0,
    );
    setSelectedGroupTitle(currentFlatUnit?.groupTitle);

    if (!isChartIndexInRange) {
      setChartIndex(0);
    }
  }, [isLoading, flatUnits, chartIndex]);

  useEffect(() => {
    if (onboardingFileSchema && isShowOnboarding && !isLoading) {
      // if user click on the chart tab (while attachment is loading) -> set tooltips for charts
      if (isShowChartsOnboarding(onboardingFileSchema)) {
        setOnboardingFileSchema?.(
          getOnboardingInfoForChartsView(onboardingFileSchema),
        );
        chartAttachmentRef?.current?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }
      // if user is on the chart (but tooltip should be shown for grid) -> go to the next tooltip
      if (
        onboardingFileSchema.lastDisplayedElement ===
        OnboardingElements.CHART_PER_SERIES
      ) {
        setOnboardingFileSchema?.(
          getOnboardingInfoForAdvancedView(onboardingFileSchema),
        );
      }
    }
  }, [
    isLoading,
    setOnboardingFileSchema,
    onboardingFileSchema,
    isShowOnboarding,
  ]);

  const nextChart = useCallback(() => {
    setChartIndex((prevV) => Math.min(prevV + 1, flatUnits.length - 1));
  }, [flatUnits.length]);

  const prevChart = useCallback(() => {
    setChartIndex((prevV) => Math.max(prevV - 1, 0));
  }, []);

  if (isLoading || isDataLoading) {
    return <Loader />;
  }

  return (
    <div className="chart-attachment w-full h-full" ref={chartAttachmentRef}>
      {attachment.charting_data && (
        <div className="flex flex-col w-full h-full gap-4">
          {flatUnits.length == 0 || selectedUnit == null ? (
            <h4 className="ml-1">{titles?.chartInfo || 'No data'}</h4>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h3 className="chart-attachment-title">
                  {titles?.chart || 'Chart'} {chartIndex + 1}/{flatUnits.length}
                </h3>
                <span className="text-neutrals-700 h4 chart-attachment-info">
                  {titles?.chartInfo || 'Chart Information'}
                </span>
              </div>
              <div
                className={classNames(
                  'chart-area overflow-hidden flex flex-row gap-4 h-full ',
                  fixHeight && 'max-h-[400px] min-h-[400px]',
                  !fixHeight && 'min-h-[300px]',
                )}
              >
                <div className="flex flex-col flex-1 min-h-0 min-w-0">
                  {selectedGroupTitle && (
                    <div className="flex items-center gap-1 mb-1">
                      <DatasetIcon className="w-4 h-4 text-neutrals-1000 flex-shrink-0" />
                      <span className="text-[12px] leading-4 font-semibold text-neutrals-1000">
                        {selectedGroupTitle}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4">
                    <ResponsiveEChart
                      option={selectedUnit.config}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: 0,
                      }}
                    />
                    {selectedUnit.limitedByRowsAmountTo && (
                      <ChartLimitationInfo
                        limitAmount={selectedUnit.limitedByRowsAmountTo}
                        openAdvancedView={openAdvancedView}
                        titles={titles}
                      ></ChartLimitationInfo>
                    )}
                    {flatUnits.length > 1 && (
                      <Slider
                        icons={icons}
                        currentIndex={chartIndex}
                        totalCount={flatUnits.length}
                        titles={titles}
                        onNext={nextChart}
                        onPrev={prevChart}
                      ></Slider>
                    )}
                  </div>
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
