import SingleLineChart from '../SingleLineChart';
import { MetadataSettings } from '../../../models/metadata';
import { Data, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { IconButton } from '@epam/statgpt-ui-components';
import ChartIcon from '../../../assets/icons/chart.svg';
import { ICellRendererParams } from 'ag-grid-community';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversationViewTitles } from '../../../context/ConversationViewTitlesContext';
import { Tooltip } from '../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../constants/onboarding-elements';
import { useOnboarding } from '../../../context/OnboardingContext';

interface ChartCellRendererParams extends ICellRendererParams {
  attributesData: Data;
  dataSetData: StructuralData;
  locale: Locale;
  metadataSettings?: MetadataSettings;
}

const ChartCellRenderer = (params: ChartCellRendererParams) => {
  const titles = useConversationViewTitles();
  const [isOpenChart, setIsOpenChart] = useState<boolean>(false);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();
  const [isChartClosed, setIsChartClosed] = useState(false);

  const openChart = useCallback(() => {
    setIsOpenChart(true);
  }, []);

  const closeChart = useCallback(() => {
    setIsOpenChart(false);
    setIsChartClosed(true);
  }, []);

  useEffect(() => {
    if (isShowOnboarding) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.CHART_PER_SERIES,
        titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [titles, isShowOnboarding]);

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

  return (
    <>
      <div ref={iconRef}>
        <IconButton
          title={titles?.chart ?? 'Chart'}
          buttonClassName="!text-neutrals-1000 !border-none !p-1"
          icon={<ChartIcon className="w-5 h-5" />}
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
      {isOpenChart && (
        <SingleLineChart
          chart={params.value}
          isOpen={isOpenChart}
          onClose={closeChart}
        />
      )}
    </>
  );
};

export default ChartCellRenderer;
