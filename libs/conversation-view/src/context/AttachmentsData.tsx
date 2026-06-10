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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CustomChartAttachmentType,
  CustomCodeAttachment,
  CustomGridAttachment,
} from '../models/attachments';
import {
  getConstraints,
  GetDatasetData,
  GetDatasetDetails,
  GetPythonAttachment,
  PutOnboardingFile,
} from '../types/actions';
import { buildCustomGridAttachment } from '../utils/attachments/data-grid/build-custom-grid-attachment';
import {
  buildDataQueryWithMergedFilters,
  getTimeQueryFilterFromAttachment,
} from '../utils/query-filters';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import {
  createChartDataResolver,
  isChartingDataPlottable,
} from '../utils/attachments/charting/chart-data';
import { ChartingStyles } from '../models/attachments-styles';
import { MetadataSettings } from '../models/metadata';
import { ConversationViewTitles } from '../models/titles';
import { Filter } from '../models/filters';
import { Attachment } from '@epam/ai-dial-shared';
import { buildMarkdownAttachments } from '../utils/attachments/markdown-attachments';
import { invokePythonAttachment } from '../utils/attachments/python-attachment';
import {
  buildRequestCacheKey,
  getCachedRequestResult,
} from '../utils/request-cache';
import { normalizeConstraintFilters } from '../utils/normalize-constraint-filters';
import {
  createInitialGridAttachment,
  createInitialChartAttachment,
} from '../constants/attachments';
import { scheduleDeferredWork } from '../utils/deferred-work';

export function useAttachmentsData(
  actions: {
    getDataSet: GetDatasetDetails;
    getDataSetData: GetDatasetData;
    getConstraints: getConstraints;
    putOnboardingFile?: PutOnboardingFile;
    getPythonAttachment?: GetPythonAttachment;
  },
  locale: string,
  dataQuery?: DataQuery,
  formattingSettings?: FormatNumbersType,
  chartStyles?: ChartingStyles,
  metadataSettings?: MetadataSettings,
  titles?: ConversationViewTitles,
  rawAttachments?: Attachment[],
  initialDatasetStructure?: StructuralData,
  isInitialDatasetStructureLoading = false,
  onCodeAttachmentUpdated?: (attachment: Attachment, datasetUrn?: string) => void,
  skipInitialConstraintsLoading = false,
) {
  const [dataMessage, setDataMessage] = useState<DataMessage | undefined>();
  const [dataset, setDataset] = useState<Dataflow | undefined>();
  const [constraints, setConstraints] = useState<DataConstraints[]>();
  const [structures, setStructures] = useState<StructuralData | undefined>();
  const [customGridAttachment, setCustomGridAttachment] =
    useState<CustomGridAttachment>(
      createInitialGridAttachment(titles?.dataGrid),
    );
  const [customChartAttachment, setCustomChartAttachment] =
    useState<CustomChartAttachmentType>(
      createInitialChartAttachment(titles?.chart),
    );
  const [isChartPlottable, setIsChartPlottable] = useState(false);
  const [codeAttachments, setCodeAttachments] = useState<
    CustomCodeAttachment[]
  >([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [structureDimensions, setStructureDimensions] = useState<
    StructureItemBase[]
  >([]);
  const [isLoadingGridData, setIsLoadingGridData] = useState(false);
  const [isBuildingGridAttachment, setIsBuildingGridAttachment] =
    useState(false);
  const pythonRequestIdRef = useRef(0);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimeRange>({
    startPeriod: null,
    endPeriod: null,
  });
  const {
    getConstraints,
    getDataSet,
    getDataSetData,
    putOnboardingFile,
    getPythonAttachment,
  } = actions;

  const applyStructureData = useCallback(
    (structure?: StructuralData | null) => {
      if (!structure) {
        return;
      }

      const dimensions = getDimensions(structure);
      setDataset(structure.dataflows?.[0] || void 0);
      setStructures(structure || void 0);
      setDimensions([
        ...(dimensions?.dimensions || []),
        ...(dimensions?.timeDimensions || []),
      ]);
    },
    [],
  );

  const loadConstraints = useCallback(
    async (dataQuery: DataQuery) => {
      const filtersDto = normalizeConstraintFilters(
        getFiltersDtoFromDataQuery(dataQuery),
      );

      try {
        const response = await getCachedRequestResult(
          getConstraints,
          buildRequestCacheKey(dataQuery.urn, filtersDto),
          () => getConstraints(dataQuery.urn, filtersDto),
        );
        const constraints = response?.data?.dataConstraints || [];
        setConstraints(constraints);
      } catch {
        setConstraints([]);
      }
    },
    [getConstraints],
  );

  const loadStructureAndData = useCallback(
    async (dataQuery: DataQuery) => {
      const structure = initialDatasetStructure
        ? { data: initialDatasetStructure }
        : await getCachedRequestResult(
            getDataSet,
            buildRequestCacheKey(dataQuery.urn),
            () => getDataSet(dataQuery.urn),
          );

      if (structure?.data) {
        const dimensions = getDimensions(structure.data);
        applyStructureData(structure.data);

        const filterKey =
          dimensions?.dimensions == null
            ? null
            : getTimeSeriesFilterKey(
                dimensions?.dimensions,
                dataQuery.filters ?? [],
              );

        const timeFilter = getTimeQueryFilterFromAttachment(
          dataQuery,
          dimensions,
        );

        getCachedRequestResult(
          getDataSetData,
          buildRequestCacheKey(dataQuery.urn, { filterKey, timeFilter }),
          () => getDataSetData(dataQuery.urn, { filterKey, timeFilter }),
        )
          .then((data) => {
            setIsBuildingGridAttachment(true);
            setDataMessage(data || void 0);
            setStructureDimensions(getStructureDimensions(data));
          })
          .finally(() => setIsLoadingGridData(false));
      }
    },
    [applyStructureData, getDataSet, getDataSetData, initialDatasetStructure],
  );

  useEffect(() => {
    applyStructureData(initialDatasetStructure);
  }, [applyStructureData, initialDatasetStructure]);

  useEffect(() => {
    async function loadDataSet(dataQuery: DataQuery) {
      setIsLoadingGridData(true);
      try {
        await Promise.all([
          ...(skipInitialConstraintsLoading
            ? []
            : [loadConstraints(dataQuery)]),
          loadStructureAndData(dataQuery),
        ]);
      } catch (err) {
        console.error('Error loading dataset details', err as object);
      }
    }

    if (
      dataQuery != null &&
      !(isInitialDatasetStructureLoading && !initialDatasetStructure)
    ) {
      loadDataSet(dataQuery);
    } else if (dataQuery != null && isInitialDatasetStructureLoading) {
      setIsLoadingGridData(true);
    }
  }, [
    dataQuery,
    initialDatasetStructure,
    isInitialDatasetStructureLoading,
    loadConstraints,
    loadStructureAndData,
    skipInitialConstraintsLoading,
  ]);

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
        getCachedRequestResult(
          getDataSetData,
          buildRequestCacheKey(dataQuery?.urn || '', filterParams),
          () => getDataSetData(dataQuery?.urn || '', filterParams),
        )
          .then((data) => {
            setIsBuildingGridAttachment(true);
            setDataMessage(data || void 0);
            setStructureDimensions(getStructureDimensions(data));
          })
          .finally(() => setIsLoadingGridData(false));

        if (getPythonAttachment && dataQuery && filters) {
          const updatedQuery = buildDataQueryWithMergedFilters(
            dataQuery,
            filters,
          );
          const originalTitle = rawAttachments?.find(
            (a) =>
              a.type === AttachmentType.MARKDOWN &&
              a.data?.includes('```python') &&
              a.title?.includes(dataQuery.urn),
          )?.title;
          invokePythonAttachment({
            getPythonAttachment,
            dataQueries: [updatedQuery],
            requestIdRef: pythonRequestIdRef,
            codeTitle: titles?.codeSamples || 'Python Code',
            markdownTitle: originalTitle ?? dataQuery.urn,
            setCodeAttachments,
            onCodeAttachmentUpdated,
            datasetUrn: dataQuery.urn,
          });
        }
      } catch (err) {
        console.error('Error loading dataset data', err as object);
      }
    },
    [
      dataQuery,
      getDataSetData,
      getPythonAttachment,
      titles,
      rawAttachments,
      onCodeAttachmentUpdated,
    ],
  );

  useEffect(() => {
    if (structures != null && dataMessage != null && constraints?.length) {
      setIsBuildingGridAttachment(true);

      const cancel = scheduleDeferredWork(() => {
        setCustomGridAttachment((prev) => ({
          ...prev,
          ...buildCustomGridAttachment(
            structures,
            dataMessage,
            dataQuery,
            locale,
            formattingSettings,
            metadataSettings,
            chartStyles,
            titles,
            putOnboardingFile,
            constraints,
            selectedTimePeriod,
          ),
        }));
        setIsBuildingGridAttachment(false);
      });

      return () => {
        cancel();
        setIsBuildingGridAttachment(false);
      };
    }

    if (dataMessage == null || constraints !== undefined) {
      setIsBuildingGridAttachment(false);
    }
    return undefined;
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
    putOnboardingFile,
  ]);

  useEffect(() => {
    if (structures == null || dataMessage == null) {
      return undefined;
    }
    const resolver = createChartDataResolver(
      structures,
      dataMessage,
      dataQuery,
      locale,
      chartStyles,
    );
    setCustomChartAttachment((prev) => ({
      ...prev,
      charting_data: undefined,
      getChartingData: resolver,
    }));
    setIsChartPlottable(false);
    return scheduleDeferredWork(() => {
      try {
        setIsChartPlottable(isChartingDataPlottable(resolver()));
      } catch (err) {
        console.error('Error evaluating chart plottability', err as object);
        setIsChartPlottable(false);
      }
    });
  }, [structures, dataMessage, dataQuery, locale, chartStyles]);

  useEffect(() => {
    if (rawAttachments?.length) {
      const markdownCodeAttachments = buildMarkdownAttachments(
        rawAttachments,
        dataQuery?.urn,
        titles?.codeSamples,
      );

      if (markdownCodeAttachments.length > 0) {
        setCodeAttachments(markdownCodeAttachments);
      }
    }
  }, [rawAttachments, titles, dataQuery]);

  const attachments = useMemo(
    () => [
      customGridAttachment,
      ...(isChartPlottable ? [customChartAttachment] : []),
      ...codeAttachments,
    ],
    [
      customGridAttachment,
      customChartAttachment,
      codeAttachments,
      isChartPlottable,
    ],
  );

  return {
    dataMessage,
    structures,
    dataset,
    dimensions,
    structureDimensions,
    onFiltersChange,
    constraints,
    isLoadingGridData: isLoadingGridData || isBuildingGridAttachment,
    dataSetAttachments: attachments,
  };
}
