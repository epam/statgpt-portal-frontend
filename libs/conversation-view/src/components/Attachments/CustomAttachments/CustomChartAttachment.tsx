'use client';

import { CustomChartAttachmentType } from '../../../models/attachments';
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { scheduleDeferredWork } from '../../../utils/deferred-work';
import {
  Loader,
  MOBILE_BREAKPOINT,
  useIsMobile,
} from '@epam/statgpt-ui-components';
import { ChartingData, ChartUnit } from '../../../models/charting';
import { ChartingIcon } from '../../../types/charting-icon';
import ChartSidebar from './ChartSidebar';
import Slider from './Slider';
import ChartLimitationInfo from './ChartLimitationInfo';
import classNames from 'classnames';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';
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
  limitationInfoPrefixIcon?: ReactNode;
  limitationInfoContentClassName?: string;
}

interface FlatChartUnit {
  unit: ChartUnit;
  groupTitle?: string;
}

export const CustomChartAttachment: FC<Props> = ({
  attachment,
  icons,
  isDataLoading,
  openAdvancedView,
  fixHeight = true,
  limitationInfoPrefixIcon,
  limitationInfoContentClassName,
}) => {
  const { titles } = useConversationViewStyles();
  const isNarrowChart = useIsMobile(MOBILE_BREAKPOINT);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartingData, setChartingData] = useState<ChartingData>();
  const [flatUnits, setFlatUnits] = useState<FlatChartUnit[]>([]);
  const [chartIndex, setChartIndex] = useState<number>(0);
  const [selectedUnit, setSelectedUnit] = useState<ChartUnit | undefined>(
    void 0,
  );
  const [selectedGroupTitle, setSelectedGroupTitle] = useState<string>();
  const { onboardingFileSchema, isShowOnboarding, setOnboardingFileSchema } =
    useOnboarding();
  const chartAttachmentRef = useRef<HTMLDivElement | null>(null);
  const { charting_data: providedChartingData, getChartingData } = attachment;

  useEffect(() => {
    setChartIndex(0);

    if (providedChartingData) {
      setChartingData(providedChartingData);
      setIsLoading(false);
      return;
    }

    if (!getChartingData) {
      setChartingData(undefined);
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    return scheduleDeferredWork(() => {
      try {
        setChartingData(getChartingData());
      } catch (err) {
        console.error('Error building chart data', err as object);
        setChartingData({ units: [] });
      } finally {
        setIsLoading(false);
      }
    });
  }, [providedChartingData, getChartingData]);

  useEffect(() => {
    const groups = chartingData?.groups ?? [];
    const units = chartingData?.units ?? [];
    setFlatUnits(
      groups.length > 0
        ? groups.flatMap((group) =>
            group.units.map((unit) => ({ unit, groupTitle: group.title })),
          )
        : units.map((unit) => ({ unit })),
    );
  }, [chartingData]);

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
    <div className="chart-attachment size-full" ref={chartAttachmentRef}>
      {chartingData && (
        <div className="flex size-full flex-col gap-4">
          {flatUnits.length == 0 || selectedUnit == null ? (
            <h4 className="ml-1">{titles?.chartInfo || 'No data'}</h4>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h3 className="chart-attachment-title">
                  {titles?.chart || 'Chart'} {chartIndex + 1}/{flatUnits.length}
                </h3>
                <span className="h4 chart-attachment-info text-neutrals-700">
                  {titles?.chartInfo || 'Chart Information'}
                </span>
              </div>
              <div
                className={classNames(
                  'chart-area flex gap-4 h-full',
                  isNarrowChart
                    ? 'flex-col overflow-auto'
                    : 'flex-row overflow-hidden',
                  isNarrowChart && 'min-h-[500px]',
                  !isNarrowChart && fixHeight && 'max-h-[400px] min-h-[400px]',
                  !isNarrowChart && !fixHeight && 'min-h-[300px]',
                )}
              >
                <div
                  className={classNames(
                    'flex min-h-0 min-w-0 flex-1 flex-col',
                    isNarrowChart && 'min-h-[360px] w-full',
                  )}
                >
                  {selectedGroupTitle && (
                    <div className="mb-1 flex items-center gap-1">
                      <DatasetIcon className="size-4 shrink-0 text-neutrals-1000" />
                      <h4 className="text-neutrals-1000">
                        {selectedGroupTitle}
                      </h4>
                    </div>
                  )}
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
                    <div
                      className={classNames(
                        'min-h-0 min-w-0 flex-1',
                        isNarrowChart && 'min-h-[280px]',
                      )}
                    >
                      <ResponsiveEChart
                        option={selectedUnit.config}
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: 0,
                        }}
                      />
                    </div>
                    {selectedUnit.limitedByRowsAmountTo && (
                      <ChartLimitationInfo
                        limitAmount={selectedUnit.limitedByRowsAmountTo}
                        openAdvancedView={openAdvancedView}
                        prefixIcon={limitationInfoPrefixIcon}
                        contentClassName={limitationInfoContentClassName}
                      />
                    )}
                    {flatUnits.length > 1 && (
                      <Slider
                        icons={icons}
                        currentIndex={chartIndex}
                        totalCount={flatUnits.length}
                        onNext={nextChart}
                        onPrev={prevChart}
                      ></Slider>
                    )}
                  </div>
                </div>
                <ChartSidebar
                  dimensionsInfo={selectedUnit.dimensions}
                  isNarrow={isNarrowChart}
                ></ChartSidebar>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
