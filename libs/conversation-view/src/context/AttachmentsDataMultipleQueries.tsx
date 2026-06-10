import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DataConstraints,
  DatasetDimensionsScheme,
  DatasetQueryFilters,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery, FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import { Filter } from '../models/filters';
import { buildDataQueryWithMergedFilters } from '../utils/query-filters';
import {
  getConstraints,
  GetDatasetData,
  GetDatasetDetails,
  GetPythonAttachment,
} from '../types/actions';
import {
  getDataConstraintsMap,
  getDataSetData,
  getStructureDataMaps,
} from '../utils/attachments/attachments-data';
import {
  CustomCodeAttachment,
  CustomGridAttachment,
} from '../models/attachments';
import {
  createInitialChartAttachment,
  createInitialCrossDatasetGridAttachment,
} from '../constants/attachments';
import { buildMarkdownAttachments } from '../utils/attachments/markdown-attachments';
import { invokePythonAttachment } from '../utils/attachments/python-attachment';
import { Attachment } from '@epam/ai-dial-shared';
import {
  ChartingStyles,
  useDatasetDimensionsMetadataMap,
} from '@epam/statgpt-conversation-view';
import { ConversationViewTitles } from '../models/titles';
import { buildCrossDatasetGridAttachment } from '../utils/attachments/cross-dataset-grid/build-cross-dataset-grid-attachment';
import { MetadataSettings } from '../models/metadata';
import { CrossDatasetGridViewMode } from '../components/AdvancedView/TableSettings/types';
import { StructureDataMaps } from '../models/structure-data';
import { createCrossDatasetChartingDataResolver } from '../utils/attachments/charting/cross-dataset-chart-data';
import { isChartingDataPlottable } from '../utils/attachments/charting/chart-data';
import { scheduleDeferredWork } from '../utils/deferred-work';
import {
  filterDataQueriesByActiveDatasetUrns,
  filterMapByActiveDatasetUrns,
  getDataQueriesWithExpandedSharedDimensionFilters,
  getImplicitSharedWildcardFilterParams,
  setDataQueryFiltersMap,
} from '../utils/multiple-filters';

const DATASET_FETCH_DEADLINE_MS = 5_000;

type DatasetResult = {
  urn: string;
  dataMessage: Awaited<ReturnType<typeof getDataSetData>>['dataMessage'];
  structureDimensions: Awaited<
    ReturnType<typeof getDataSetData>
  >['structureDimensions'];
};

export function useAttachmentsDataMultipleQueries(
  actions: {
    getDataSet: GetDatasetDetails;
    getDataSetData: GetDatasetData;
    getConstraints: getConstraints;
    getPythonAttachment?: GetPythonAttachment;
  },
  locale: string,
  compatibleDataQueries?: DataQuery[],
  chartStyles?: ChartingStyles,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  rawAttachments?: Attachment[],
  initialActiveDatasetUrns?: string[],
  onCodeAttachmentUpdated?: (attachment: Attachment, datasetUrn?: string) => void,
  gridViewMode: CrossDatasetGridViewMode = CrossDatasetGridViewMode.Compact,
  titles?: ConversationViewTitles,
) {
  const normalizedInitialActiveDatasetUrns = Array.isArray(
    initialActiveDatasetUrns,
  )
    ? initialActiveDatasetUrns
    : undefined;
  const [structureDataMaps, setStructureDataMaps] =
    useState<StructureDataMaps>();
  const [datasetDimensionsSchemesMap, setDatasetDimensionsSchemesMap] =
    useState<Map<string, DatasetDimensionsScheme | undefined>>();
  const [isLoadingGridData, setIsLoadingGridData] = useState(false);
  const [activeDatasetUrns, setActiveDatasetUrns] =
    useState<Set<string> | null>(
      normalizedInitialActiveDatasetUrns
        ? new Set(normalizedInitialActiveDatasetUrns)
        : null,
    );
  const [
    isBuildingCrossDatasetGridAttachment,
    setIsBuildingCrossDatasetGridAttachment,
  ] = useState(false);

  const pythonRequestIdRef = useRef(0);
  const prevGridViewModeRef = useRef(gridViewMode);
  const prevStructureDataMapsRef = useRef(structureDataMaps);
  const currentInvocationRef = useRef(0);
  const adaptiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [crossDatasetGridAttachment, setCrossDatasetGridAttachment] =
    useState<CustomGridAttachment>(
      createInitialCrossDatasetGridAttachment(titles?.dataGrid),
    );
  const [crossDatasetChartAttachment, setCrossDatasetChartAttachment] =
    useState(createInitialChartAttachment(titles?.chart));
  const [isCrossDatasetChartPlottable, setIsCrossDatasetChartPlottable] =
    useState(false);
  const [codeAttachments, setCodeAttachments] = useState<
    CustomCodeAttachment[]
  >([]);

  const {
    getConstraints,
    getDataSet,
    getDataSetData: getDataSetDataAction,
    getPythonAttachment,
  } = actions;

  const dataQueriesRef = useRef(compatibleDataQueries);
  dataQueriesRef.current = compatibleDataQueries;
  const initialActiveDatasetUrnsRef = useRef(
    normalizedInitialActiveDatasetUrns,
  );
  initialActiveDatasetUrnsRef.current = normalizedInitialActiveDatasetUrns;

  const dataQueriesUrnsKey = useMemo(
    () => compatibleDataQueries?.map((q) => q.urn).join(',') ?? '',
    [compatibleDataQueries],
  );
  const datasetDimensionsMetadata = useDatasetDimensionsMetadataMap();
  const { getDimensionsScheme } = datasetDimensionsMetadata;

  const loadConstraintsMap = useCallback(
    async (dataQueries: DataQuery[]) => {
      try {
        const constraintsMap = await getDataConstraintsMap(
          dataQueries.map((q) => ({ ...q, filters: [] })),
          getConstraints,
        );
        const expandedDataQueries =
          getDataQueriesWithExpandedSharedDimensionFilters(
            dataQueries,
            constraintsMap,
            datasetDimensionsMetadata.map,
          );
        const resolvedConstraintsMap =
          expandedDataQueries === dataQueries
            ? constraintsMap
            : await getDataConstraintsMap(expandedDataQueries, getConstraints);

        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap: resolvedConstraintsMap,
        }));
        return resolvedConstraintsMap;
      } catch {
        const constraintsMap = new Map<string, DataConstraints[]>();
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap,
        }));
        return constraintsMap;
      }
    },
    [datasetDimensionsMetadata.map, getConstraints],
  );

  const loadStructureData = useCallback(
    async (
      dataQueries: DataQuery[],
      constraintsMap?: Map<string, DataConstraints[] | undefined>,
    ) => {
      const structureDataMaps = await getStructureDataMaps(
        dataQueries,
        getDataSet,
        getDataSetDataAction,
        setIsLoadingGridData,
        async (structureDataMaps) => {
          const enabledDataQueries = dataQueries.filter((q) => !q.disabled);
          const implicitWildcardFilterParams =
            getImplicitSharedWildcardFilterParams(
              enabledDataQueries,
              structureDataMaps,
              constraintsMap,
              locale,
              datasetDimensionsMetadata.map,
            );

          if (!implicitWildcardFilterParams) {
            return undefined;
          }

          setActiveDatasetUrns(implicitWildcardFilterParams.compatibleUrns);

          return implicitWildcardFilterParams.filterParamsMap;
        },
      );
      setStructureDataMaps((prevStructureDataMaps) => ({
        ...prevStructureDataMaps,
        ...structureDataMaps,
        constraintsMap: constraintsMap ?? prevStructureDataMaps?.constraintsMap,
      }));
    },
    [datasetDimensionsMetadata.map, getDataSet, getDataSetDataAction, locale],
  );

  const loadDimensionsSchemes = useCallback(
    (dataQueries: DataQuery[]) => {
      const dimensionSchemesMap = new Map<
        string,
        DatasetDimensionsScheme | undefined
      >();
      for (const dataQuery of dataQueries) {
        dimensionSchemesMap.set(
          dataQuery.urn,
          getDimensionsScheme(dataQuery.urn),
        );
      }
      setDatasetDimensionsSchemesMap(dimensionSchemesMap);
    },
    [getDimensionsScheme],
  );

  useEffect(() => {
    async function loadDataSets(dq: DataQuery[]) {
      const restoredDatasetUrns = initialActiveDatasetUrnsRef.current;
      setActiveDatasetUrns(
        restoredDatasetUrns ? new Set(restoredDatasetUrns) : null,
      );
      setIsLoadingGridData(true);

      try {
        loadDimensionsSchemes(dq);
        const constraintsMap = await loadConstraintsMap(dq);
        await loadStructureData(dq, constraintsMap);
      } catch (err) {
        console.error('Error loading dataset details', err as object);
      } finally {
        setIsLoadingGridData(false);
      }
    }

    const currentDataQueries = dataQueriesRef.current;
    if (currentDataQueries?.length) {
      loadDataSets(currentDataQueries);
    }
  }, [
    dataQueriesUrnsKey,
    loadConstraintsMap,
    loadDimensionsSchemes,
    loadStructureData,
  ]);

  useEffect(() => {
    if (rawAttachments?.length) {
      const markdownCodeAttachments = buildMarkdownAttachments(
        rawAttachments,
        undefined,
        titles?.codeSamples,
      );

      if (markdownCodeAttachments.length > 0) {
        setCodeAttachments(markdownCodeAttachments);
      }
    }
  }, [rawAttachments, titles]);

  useEffect(() => {
    return () => {
      if (adaptiveTimerRef.current !== null) {
        clearTimeout(adaptiveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const isOnlyModeChange =
      prevGridViewModeRef.current !== gridViewMode &&
      prevStructureDataMapsRef.current === structureDataMaps;
    prevGridViewModeRef.current = gridViewMode;
    prevStructureDataMapsRef.current = structureDataMaps;

    const { structuresMap, dataMessagesMap, constraintsMap } =
      structureDataMaps ?? {};
    if (
      structuresMap != null &&
      structuresMap.size > 0 &&
      dataMessagesMap != null &&
      constraintsMap != null &&
      datasetDimensionsSchemesMap != null &&
      !isLoadingGridData
    ) {
      if (!isOnlyModeChange) {
        setIsBuildingCrossDatasetGridAttachment(true);
      }

      const cancel = scheduleDeferredWork(() => {
        const nonDisabledQueries = compatibleDataQueries?.filter(
          (q) => !q.disabled,
        );
        const effectiveActiveUrns =
          activeDatasetUrns ??
          new Set((nonDisabledQueries ?? []).map((q) => q.urn));
        const visibleDataQueries = filterDataQueriesByActiveDatasetUrns(
          nonDisabledQueries,
          effectiveActiveUrns,
        );
        const visibleStructuresMap = filterMapByActiveDatasetUrns(
          structuresMap,
          effectiveActiveUrns,
        );
        const visibleDataMessagesMap = filterMapByActiveDatasetUrns(
          dataMessagesMap,
          effectiveActiveUrns,
        );
        const visibleDimensionsSchemesMap = filterMapByActiveDatasetUrns(
          datasetDimensionsSchemesMap,
          effectiveActiveUrns,
        );

        setCrossDatasetGridAttachment((prev) => ({
          ...prev,
          ...buildCrossDatasetGridAttachment(
            visibleStructuresMap,
            visibleDataMessagesMap,
            visibleDimensionsSchemesMap,
            visibleDataQueries,
            locale,
            formattingSettings,
            metadataSettings,
            chartStyles,
            titles,
            constraintsMap,
            {
              startPeriod: null,
              endPeriod: null,
            },
            gridViewMode,
          ),
        }));
        if (!isOnlyModeChange) {
          setIsBuildingCrossDatasetGridAttachment(false);
        }
      });

      return () => {
        cancel();
        if (!isOnlyModeChange) {
          setIsBuildingCrossDatasetGridAttachment(false);
        }
      };
    }

    if (!isOnlyModeChange) {
      setIsBuildingCrossDatasetGridAttachment(false);
    }
    return undefined;
  }, [
    structureDataMaps,
    compatibleDataQueries,
    locale,
    formattingSettings,
    metadataSettings,
    chartStyles,
    titles,
    datasetDimensionsSchemesMap,
    isLoadingGridData,
    activeDatasetUrns,
    gridViewMode,
  ]);

  useEffect(() => {
    const { structuresMap, dataMessagesMap } = structureDataMaps ?? {};

    if (
      structuresMap != null &&
      structuresMap.size > 0 &&
      dataMessagesMap != null &&
      !isLoadingGridData
    ) {
      const nonDisabledQueries = compatibleDataQueries?.filter(
        (q) => !q.disabled,
      );
      const effectiveActiveUrns =
        activeDatasetUrns ??
        new Set((nonDisabledQueries ?? []).map((q) => q.urn));
      const visibleDataQueries = filterDataQueriesByActiveDatasetUrns(
        nonDisabledQueries,
        effectiveActiveUrns,
      );
      const visibleStructuresMap = filterMapByActiveDatasetUrns(
        structuresMap,
        effectiveActiveUrns,
      );
      const visibleDataMessagesMap = filterMapByActiveDatasetUrns(
        dataMessagesMap,
        effectiveActiveUrns,
      );

      const resolver = createCrossDatasetChartingDataResolver(
        visibleStructuresMap,
        visibleDataMessagesMap,
        visibleDataQueries,
        locale,
        chartStyles,
      );
      setCrossDatasetChartAttachment((prev) => ({
        ...prev,
        charting_data: undefined,
        getChartingData: resolver,
      }));
      setIsCrossDatasetChartPlottable(false);
      return scheduleDeferredWork(() => {
        try {
          setIsCrossDatasetChartPlottable(isChartingDataPlottable(resolver()));
        } catch (err) {
          console.error(
            'Error evaluating cross-dataset chart plottability',
            err as object,
          );
          setIsCrossDatasetChartPlottable(false);
        }
      });
    }
    return undefined;
  }, [
    structureDataMaps,
    compatibleDataQueries,
    locale,
    chartStyles,
    isLoadingGridData,
    activeDatasetUrns,
  ]);

  const crossDatasetAttachments = useMemo(
    () => [
      crossDatasetGridAttachment,
      ...(isCrossDatasetChartPlottable ? [crossDatasetChartAttachment] : []),
      ...codeAttachments,
    ],
    [
      crossDatasetGridAttachment,
      crossDatasetChartAttachment,
      codeAttachments,
      isCrossDatasetChartPlottable,
    ],
  );

  const onMultipleDataFiltersChange = useCallback(
    (
      filterParamsMap: Map<string, DatasetQueryFilters>,
      constraintsMap?: Map<string, DataConstraints[] | undefined>,
      dataQueries?: DataQuery[],
      filtersMap?: Map<string, Filter[]>,
      filters?: Filter[],
    ): void => {
      try {
        setIsLoadingGridData(true);
        const invocationId = ++currentInvocationRef.current;
        if (adaptiveTimerRef.current !== null) {
          clearTimeout(adaptiveTimerRef.current);
          adaptiveTimerRef.current = null;
        }
        const enabledDataQueries =
          dataQueries?.filter((q) => !q.disabled) ?? [];
        const compatibleUrns = new Set(enabledDataQueries.map((q) => q.urn));
        setActiveDatasetUrns(compatibleUrns);
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap,
        }));

        if (!enabledDataQueries.length) {
          setIsLoadingGridData(false);
          return;
        }

        const queryFiltersMap = filtersMap
          ? setDataQueryFiltersMap(enabledDataQueries, filtersMap)
          : undefined;
        const dataQueriesWithAppliedFilters = queryFiltersMap
          ? enabledDataQueries.map((dataQuery) => ({
              ...dataQuery,
              filters: queryFiltersMap.get(dataQuery.urn) ?? [],
            }))
          : enabledDataQueries;
        const implicitWildcardFilterParams =
          constraintsMap && structureDataMaps
            ? getImplicitSharedWildcardFilterParams(
                dataQueriesWithAppliedFilters,
                structureDataMaps,
                constraintsMap,
                locale,
                datasetDimensionsMetadata.map,
              )
            : undefined;
        const resolvedFilterParamsMap =
          implicitWildcardFilterParams?.filterParamsMap ?? filterParamsMap;

        const completedResults = new Map<string, DatasetResult>();

        const flushToGrid = () => {
          if (completedResults.size === 0) return;
          setIsBuildingCrossDatasetGridAttachment(true);
          const snapshot = [...completedResults.values()];
          completedResults.clear();
          setStructureDataMaps((prev) => {
            const dataMessagesMap = new Map(prev?.dataMessagesMap);
            const structureDimensionsMap = new Map(
              prev?.structureDimensionsMap,
            );
            snapshot.forEach(({ urn, dataMessage, structureDimensions }) => {
              dataMessagesMap.set(urn, dataMessage);
              structureDimensionsMap.set(urn, structureDimensions || []);
            });
            return { ...prev, dataMessagesMap, structureDimensionsMap };
          });
        };

        adaptiveTimerRef.current = setTimeout(() => {
          adaptiveTimerRef.current = null;
          if (invocationId !== currentInvocationRef.current) return;
          if (completedResults.size > 0) {
            flushToGrid();
            setIsLoadingGridData(false);
          }
        }, DATASET_FETCH_DEADLINE_MS);

        const fetchPromises = enabledDataQueries.map((dataQuery) =>
          getDataSetData(
            dataQuery,
            resolvedFilterParamsMap?.get(dataQuery?.urn) as DatasetQueryFilters,
            getDataSetDataAction,
          ).then(({ dataMessage, structureDimensions }) => {
            completedResults.set(dataQuery.urn, {
              urn: dataQuery.urn,
              dataMessage,
              structureDimensions,
            });
          }),
        );

        Promise.allSettled(fetchPromises).finally(() => {
          if (invocationId !== currentInvocationRef.current) return;
          if (adaptiveTimerRef.current !== null) {
            clearTimeout(adaptiveTimerRef.current);
            adaptiveTimerRef.current = null;
          }
          flushToGrid();
          setIsLoadingGridData(false);
        });

        if (getPythonAttachment && enabledDataQueries.length) {
          const updatedDataQueries = enabledDataQueries.map((dq) =>
            buildDataQueryWithMergedFilters(
              dq,
              filters ?? filtersMap?.get(dq.urn) ?? [],
            ),
          );
          invokePythonAttachment({
            getPythonAttachment,
            dataQueries: updatedDataQueries,
            requestIdRef: pythonRequestIdRef,
            codeTitle: titles?.codeSamples || 'Python Code',
            markdownTitle: 'Python Code',
            setCodeAttachments,
            onCodeAttachmentUpdated,
          });
        }
      } catch (err) {
        console.error('Error loading dataset data', err as object);
      }
    },
    [
      datasetDimensionsMetadata.map,
      getDataSetDataAction,
      getPythonAttachment,
      locale,
      onCodeAttachmentUpdated,
      structureDataMaps,
      titles,
    ],
  );

  return {
    structureDataMaps,
    datasetDimensionsSchemesMap,
    isLoadingGridData:
      isLoadingGridData || isBuildingCrossDatasetGridAttachment,
    crossDatasetAttachments,
    activeDatasetUrns,
    onMultipleDataFiltersChange,
  };
}
