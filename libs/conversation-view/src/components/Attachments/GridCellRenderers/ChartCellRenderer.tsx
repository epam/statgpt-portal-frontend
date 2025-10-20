import SingleLineChart from '../SingleLineChart';
import { MetadataSettings } from '../../../models/metadata';
import { Data } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { Locale } from '@statgpt/shared-toolkit/src/types/locale';
import ChartIcon from '../../../assets/icons/chart.svg';
import { IconButton } from '@statgpt/ui-components/src/components/IconButton/IconButton';
import { ICellRendererParams } from 'ag-grid-community';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConversationViewTitles } from '../../../models/titles';
import { Tooltip } from '../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../constants/onboarding-elements';
import { useOnboarding } from '../../../context/OnboardingContext';

interface ChartCellRendererParams extends ICellRendererParams {
  attributesData: Data;
  dataSetData: StructuralData;
  locale: Locale;
  titles?: ConversationViewTitles;
  metadataSettings?: MetadataSettings;
}

const ChartCellRenderer = (params: ChartCellRendererParams) => {
  const [isOpenChart, setIsOpenChart] = useState<boolean>(false);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();

  const openChart = useCallback(() => {
    setIsOpenChart(true);
  }, []);

  const closeChart = useCallback(() => {
    setIsOpenChart(false);
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

  return (
    <>
      <div ref={iconRef}>
        <IconButton
          title={params.titles?.chart ?? 'Chart'}
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
        />
      )}
      {isOpenChart && (
        <SingleLineChart
          chart={params.value}
          isOpen={isOpenChart}
          onClose={closeChart}
          titles={params.titles}
        />
      )}
    </>
  );
};

export default ChartCellRenderer;
