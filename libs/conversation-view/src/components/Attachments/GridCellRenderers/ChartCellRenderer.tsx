import SingleLineChart from '../SingleLineChart';
import { MetadataSettings } from '../../../models/metadata';
import { Data, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { IconButton } from '@epam/statgpt-ui-components';
import ChartIcon from '../../../assets/icons/chart.svg';
import { ICellRendererParams } from 'ag-grid-community';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConversationViewTitles } from '../../../models/titles';
import { ChartUnit, ChartUnitValue } from '../../../models/charting';
import { Tooltip } from '../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../constants/onboarding-elements';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';

interface ChartCellRendererParams extends ICellRendererParams {
  attributesData: Data;
  dataSetData: StructuralData;
  locale: Locale;
  titles?: ConversationViewTitles;
  metadataSettings?: MetadataSettings;
}

const ChartCellRenderer = (params: ChartCellRendererParams) => {
  const [isOpenChart, setIsOpenChart] = useState<boolean>(false);
  const [chart, setChart] = useState<ChartUnit>();
  const iconRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const [isChartClosed, setIsChartClosed] = useState(false);

  const openChart = useCallback(() => {
    setChart((currentChart) => currentChart ?? getChartUnit(params.value));
    setIsOpenChart(true);
  }, [params.value]);

  const closeChart = useCallback(() => {
    setIsOpenChart(false);
    setIsChartClosed(true);
  }, []);

  useEffect(() => {
    if (isShowOnboarding) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.CHART_PER_SERIES,
        params.titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [params.titles, isShowOnboarding]);

  useEffect(() => {
    if (isShowOnboarding) {
      setIsTooltipVisible(
        onboardingFileSchema?.lastDisplayedElement ===
          OnboardingElements.CHART_PER_SERIES && params.node.rowIndex === 0,
      );
    }
  }, [
    onboardingFileSchema?.lastDisplayedElement,
    params.node.rowIndex,
    isShowOnboarding,
  ]);

  useEffect(() => {
    setChart(undefined);
  }, [params.value]);

  return (
    <>
      <div ref={iconRef}>
        <IconButton
          title={params.titles?.chart ?? 'Chart'}
          buttonClassName="!text-neutrals-1000 !border-none !p-1"
          icon={<ChartIcon className="size-5" />}
          onClick={openChart}
        />
      </div>
      {isTooltipVisible && (
        <Tooltip
          reference={iconRef}
          title={tooltipTitle}
          description={tooltipDescription}
          onReferenceClick={openChart}
          shouldCloseTooltip={isChartClosed}
        />
      )}
      {isOpenChart && chart && (
        <SingleLineChart
          chart={chart}
          isOpen={isOpenChart}
          onClose={closeChart}
          titles={params.titles}
          datasetTitle={
            isCrossDatasetModeOn
              ? (params.data?.datasetTitle ?? undefined)
              : undefined
          }
        />
      )}
    </>
  );
};

function getChartUnit(
  chartValue: ChartUnitValue | undefined,
): ChartUnit | undefined {
  return typeof chartValue === 'function' ? chartValue() : chartValue;
}

export default ChartCellRenderer;
