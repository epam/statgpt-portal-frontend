import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataMessage } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import {
  CustomChartAttachmentType,
  CustomGridAttachment,
} from '@statgpt/conversation-view/src/models/attachments';
import { AttachmentType } from '@statgpt/dial-toolkit/src/types/attachment-type';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { StructureItemBase } from '@statgpt/sdmx-toolkit/src/models/data/structure';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import {
  getDimensions,
  getStructureDimensions,
} from '@statgpt/sdmx-toolkit/src/utils/get-dimensions';
import {
  getConstraints,
  GetDatasetData,
  GetDatasetDetails,
} from '@statgpt/conversation-view/src/types/actions';
import { buildGridData } from '@statgpt/conversation-view/src/utils/attachments/data-grid/data-grid';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';
import { getTimeSeriesFilterKey } from '@statgpt/shared-toolkit/src/utils/query-filters';
import {
  getTimeQueryFilterFromAttachment,
  getUpdatedQueryTimeSeriesFilters,
} from '@statgpt/conversation-view/src/utils/query-filters';
import { buildChartData } from '@statgpt/conversation-view/src/utils/attachments/charting/chart-data';
import { ChartingStyles } from '@statgpt/conversation-view/src/models/attachments-styles';
import { MetadataSettings } from '@statgpt/conversation-view/src/models/metadata';
import { DataConstraints } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/constraints';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

export function useAttachmentsData(
  actions: {
    getDataSet: GetDatasetDetails;
    getDataSetData: GetDatasetData;
    getConstraints: getConstraints;
  },
  locale: string,
  dataQuery?: DataQuery,
  formattingSettings?: FormatNumbersType,
  chartStyles?: ChartingStyles,
  metadataSettings?: MetadataSettings,
  titles?: ConversationViewTitles,
) {
  const [dataMessage, setDataMessage] = useState<DataMessage | undefined>();
  const [dataset, setDataset] = useState<Dataflow | undefined>();
  const [constraints, setConstraints] = useState<DataConstraints[]>();
  const [structures, setStructures] = useState<StructuralData | undefined>();
  const [customGridAttachment, setCustomGridAttachment] =
    useState<CustomGridAttachment>({
      title: titles?.dataGrid || 'Data Grid',
      type: AttachmentType.CUSTOM_DATA_GRID,
    });
  const [customChartAttachment, setCustomChartAttachment] =
    useState<CustomChartAttachmentType>({
      title: titles?.chart || 'Chart',
      type: AttachmentType.CUSTOM_CHART,
    });
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [structureDimensions, setStructureDimensions] = useState<
    StructureItemBase[]
  >([]);
  const [isLoadingGridData, setIsLoadingGridData] = useState(false);

  useEffect(() => {
    function loadDatSet(dataQuery: DataQuery) {
      setIsLoadingGridData(true);
      try {
        actions
          .getConstraints(dataQuery.urn)
          .then((constraints) => {
            setConstraints(constraints?.data?.dataConstraints || []);
          })
          .catch(() => {
            setConstraints([]);
          });

        actions.getDataSet(dataQuery.urn).then((dataSet) => {
          if (dataSet?.data) {
            const dimensions = getDimensions(dataSet.data);
            setDataset(dataSet.data.dataflows?.[0] || void 0);
            setStructures(dataSet.data || void 0);
            setDimensions([
              ...(dimensions?.dimensions || []),
              ...(dimensions?.timeDimensions || []),
            ]);

            const filterKey =
              dimensions?.dimensions == null
                ? null
                : getTimeSeriesFilterKey(
                    dimensions?.dimensions,
                    getUpdatedQueryTimeSeriesFilters(dataQuery.filters),
                  );

            const timeFilter = getTimeQueryFilterFromAttachment(
              dataQuery,
              dimensions,
            );

            actions
              .getDataSetData(dataQuery.urn, { filterKey, timeFilter })
              .then((data) => {
                setDataMessage(data || void 0);
                setStructureDimensions(getStructureDimensions(data));
              })
              .finally(() => setIsLoadingGridData(false));
          }
        });
      } catch (err) {
        console.error('Error loading dataset details', err as object);
      }
    }

    if (dataQuery != null) {
      loadDatSet(dataQuery);
    }
  }, [actions, dataQuery]);

  const onFiltersChange = useCallback(
    (filterParams: DatasetQueryFilters) => {
      try {
        setIsLoadingGridData(true);
        actions
          .getDataSetData(dataQuery?.urn || '', filterParams)
          .then((data) => {
            setDataMessage(data || void 0);
            setStructureDimensions(getStructureDimensions(data));
          })
          .finally(() => setIsLoadingGridData(false));
      } catch (err) {
        console.error('Error loading dataset data', err as object);
      }
    },
    [actions, dataQuery],
  );

  useEffect(() => {
    if (structures != null && dataMessage != null) {
      const dataSetName = structures.dataflows?.[0]?.names?.[locale];
      const gridData = buildGridData(
        structures,
        dataMessage,
        dataQuery,
        locale,
        formattingSettings,
        metadataSettings,
        chartStyles,
        titles,
      );

      setCustomGridAttachment((prev) => ({
        ...prev,
        title: dataSetName || titles?.dataGrid || 'Data Grid',
        grid_data: gridData,
      }));
    }
  }, [
    structures,
    dataMessage,
    titles,
    locale,
    formattingSettings,
    dataQuery,
    metadataSettings,
    chartStyles,
  ]);

  useEffect(() => {
    if (structures != null && dataMessage != null) {
      setCustomChartAttachment((prev) => {
        const chD = buildChartData(
          structures,
          dataMessage,
          dataQuery,
          locale,
          chartStyles,
        );

        return {
          ...prev,
          charting_data: chD,
        };
      });
    }
  }, [structures, dataMessage, dataQuery, locale, chartStyles]);

  const attachments = useMemo(
    () => [customGridAttachment, customChartAttachment],
    [customGridAttachment, customChartAttachment],
  );

  return {
    dataMessage,
    structures,
    dataset,
    dimensions,
    structureDimensions,
    onFiltersChange,
    constraints,
    isLoadingGridData,
    dataSetAttachments: attachments,
  };
}
