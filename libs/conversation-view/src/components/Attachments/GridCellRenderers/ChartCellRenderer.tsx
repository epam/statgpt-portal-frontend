import SingleLineChart from '@statgpt/conversation-view/src/components/Attachments/SingleLineChart';
import { MetadataSettings } from '@statgpt/conversation-view/src/models/metadata';
import { Data } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { Locale } from '@statgpt/shared-toolkit/src/types/locale';
import ChartIcon from '@statgpt/conversation-view/src/assets/icons/chart.svg';
import { IconButton } from '@statgpt/ui-components/src/components/IconButton/IconButton';
import { ICellRendererParams } from 'ag-grid-community';
import { useCallback, useState } from 'react';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

interface ChartCellRendererParams extends ICellRendererParams {
  attributesData: Data;
  dataSetData: StructuralData;
  locale: Locale;
  titles?: ConversationViewTitles;
  metadataSettings?: MetadataSettings;
}

const ChartCellRenderer = (params: ChartCellRendererParams) => {
  const [isOpenChart, setIsOpenChart] = useState<boolean>(false);

  const openChart = useCallback(() => {
    setIsOpenChart(true);
  }, []);

  const closeChart = useCallback(() => {
    setIsOpenChart(false);
  }, []);

  return (
    <>
      <IconButton
        title={params.titles?.chart ?? 'Chart'}
        buttonClassName="text-neutrals-1000 border-none p-1"
        icon={<ChartIcon className="w-5 h-5" />}
        onClick={openChart}
      />
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
