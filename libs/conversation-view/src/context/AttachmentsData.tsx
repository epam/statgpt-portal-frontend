import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import {
  DataConstraints,
  Dataflow,
  DataMessage,
  DatasetQueryFilters,
  Dimension,
  getDimensions,
  getStructureDimensions,
  getFiltersDtoFromDataQuery,
  getTimeSeriesFilterKey,
  StructuralData,
  StructureItemBase,
  TIME_PERIOD,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  FormatNumbersType,
  TimeRange,
} from '@epam/statgpt-shared-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CustomChartAttachmentType,
  CustomCodeAttachment,
  CustomGridAttachment,
} from '../models/attachments';
import {
  getConstraints,
  GetDatasetData,
  GetDatasetDetails,
  PutOnboardingFile,
} from '../types/actions';
import { buildGridData } from '../utils/attachments/data-grid/data-grid';
import { getTimeQueryFilterFromAttachment } from '../utils/query-filters';
import { buildChartData } from '../utils/attachments/charting/chart-data';
import { ChartingStyles } from '../models/attachments-styles';
import { MetadataSettings } from '../models/metadata';
import { ConversationViewTitles } from '../models/titles';
import { Filter } from '../models/filters';
import { Attachment } from '@epam/ai-dial-shared';
import { unwrapMarkdownCode } from '../utils/attachments/unwrap-markdown-code';

const ALLOWED_CODE_SAMPLE_LANGUAGES = ['python'];

export function useAttachmentsData(
  actions: {
    getDataSet: GetDatasetDetails;
    getDataSetData: GetDatasetData;
    getConstraints: getConstraints;
    putOnboardingFile?: PutOnboardingFile;
  },
  locale: string,
  dataQuery?: DataQuery,
  formattingSettings?: FormatNumbersType,
  chartStyles?: ChartingStyles,
  metadataSettings?: MetadataSettings,
  titles?: ConversationViewTitles,
  rawAttachments?: Attachment[],
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
  const [codeAttachments, setCodeAttachments] = useState<
    CustomCodeAttachment[]
  >([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [structureDimensions, setStructureDimensions] = useState<
    StructureItemBase[]
  >([]);
  const [isLoadingGridData, setIsLoadingGridData] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimeRange>({
    startPeriod: null,
    endPeriod: null,
  });

  const loadConstraints = useCallback(
    async (dataQuery: DataQuery) => {
      const filtersDto = getFiltersDtoFromDataQuery(dataQuery);

      try {
        const response = await actions.getConstraints(
          dataQuery.urn,
          filtersDto,
        );
        const constraints = response?.data?.dataConstraints || [];
        setConstraints(constraints);
      } catch {
        setConstraints([]);
      }
    },
    [actions, setConstraints],
  );

  const loadStructureAndData = useCallback(
    async (dataQuery: DataQuery) => {
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
                  dataQuery.filters,
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
    },
    [actions],
  );

  useEffect(() => {
    async function loadDatSet(dataQuery: DataQuery) {
      setIsLoadingGridData(true);
      try {
        await Promise.all([
          loadConstraints(dataQuery),
          loadStructureAndData(dataQuery),
        ]);
      } catch (err) {
        console.error('Error loading dataset details', err as object);
      }
    }

    if (dataQuery != null) {
      loadDatSet(dataQuery);
    }
  }, [actions, dataQuery, loadConstraints, loadStructureAndData]);

  const onFiltersChange = useCallback(
    (
      filterParams: DatasetQueryFilters,
      constraints: DataConstraints[],
      filters?: Filter[],
    ) => {
      try {
        setIsLoadingGridData(true);
        setConstraints(constraints);
        const timePeriodFilter = filters?.find(
          (filter) => filter.id === TIME_PERIOD,
        )?.timeRange;
        if (timePeriodFilter) {
          setSelectedTimePeriod(timePeriodFilter);
        }
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
    if (structures != null && dataMessage != null && constraints?.length) {
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
        actions?.putOnboardingFile,
        constraints,
        selectedTimePeriod,
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
    constraints,
    selectedTimePeriod,
    actions?.putOnboardingFile,
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

  useEffect(() => {
    if (rawAttachments?.length) {
      const urn = dataQuery?.urn;

      const mdParsedAttachments = rawAttachments
        .filter((a) => a.type === AttachmentType.MARKDOWN)
        .filter((a) => !urn || a.title?.includes(urn))
        .map((a) => {
          const parsed = unwrapMarkdownCode(a.data ?? '');
          return {
            title: titles?.codeSamples ?? 'Code samples',
            type: AttachmentType.CUSTOM_CODE_SAMPLE,
            language: parsed.language,
            data: parsed.code,
          } as CustomCodeAttachment;
        })
        .filter((a) =>
          ALLOWED_CODE_SAMPLE_LANGUAGES.includes(a.language ?? ''),
        );

      setCodeAttachments(mdParsedAttachments);
    }
  }, [rawAttachments, titles, dataQuery]);

  const attachments = useMemo(
    () => [customGridAttachment, customChartAttachment, ...codeAttachments],
    [customGridAttachment, customChartAttachment, codeAttachments],
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
