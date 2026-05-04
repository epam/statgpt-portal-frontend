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
import { useConversationViewTitles } from './ConversationViewTitlesContext';
import {
  ChartingStyles,
  useDatasetDimensionsMetadataMap,
} from '@epam/statgpt-conversation-view';
import { buildCrossDatasetGridAttachment } from '../utils/attachments/cross-dataset-grid/build-cross-dataset-grid-attachment';
import { MetadataSettings } from '../models/metadata';
import { StructureDataMaps } from '../models/structure-data';
import { createCrossDatasetChartingDataResolver } from '../utils/attachments/charting/cross-dataset-chart-data';
import { scheduleDeferredWork } from '../utils/deferred-work';

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
  onCodeAttachmentUpdated?: (attachment: Attachment) => void,
) {
  const [structureDataMaps, setStructureDataMaps] =
    useState<StructureDataMaps>();
  const titles = useConversationViewTitles();
  const [datasetDimensionsSchemesMap, setDatasetDimensionsSchemesMap] =
    useState<Map<string, DatasetDimensionsScheme | undefined>>();
  const [isLoadingGridData, setIsLoadingGridData] = useState(false);
  const [
    isBuildingCrossDatasetGridAttachment,
    setIsBuildingCrossDatasetGridAttachment,
  ] = useState(false);

  const pythonRequestIdRef = useRef(0);

  const [crossDatasetGridAttachment, setCrossDatasetGridAttachment] =
    useState<CustomGridAttachment>(
      createInitialCrossDatasetGridAttachment(titles?.dataGrid),
    );
  const [crossDatasetChartAttachment, setCrossDatasetChartAttachment] =
    useState(createInitialChartAttachment(titles?.chart));
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

  const dataQueriesUrnsKey = useMemo(
    () => compatibleDataQueries?.map((q) => q.urn).join(',') ?? '',
    [compatibleDataQueries],
  );

  const loadConstraintsMap = useCallback(
    async (dataQueries: DataQuery[]) => {
      try {
        const constraintsMap = await getDataConstraintsMap(
          dataQueries.map((q) => ({ ...q, filters: [] })),
          getConstraints,
        );
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap,
        }));
      } catch {
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap: new Map<string, DataConstraints[]>(),
        }));
      }
    },
    [getConstraints],
  );

  const loadStructureData = useCallback(
    async (dataQueries: DataQuery[]) => {
      const structureDataMaps = await getStructureDataMaps(
        dataQueries,
        getDataSet,
        getDataSetDataAction,
        setIsLoadingGridData,
      );
      setStructureDataMaps((prevStructureDataMaps) => ({
        ...prevStructureDataMaps,
        ...structureDataMaps,
      }));
    },
    [getDataSet, getDataSetDataAction],
  );

  const { getDimensionsScheme } = useDatasetDimensionsMetadataMap();

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
      setIsLoadingGridData(true);

      try {
        loadDimensionsSchemes(dq);
        await Promise.all([loadConstraintsMap(dq), loadStructureData(dq)]);
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
      setIsBuildingCrossDatasetGridAttachment(true);

      const cancel = scheduleDeferredWork(() => {
        setCrossDatasetGridAttachment((prev) => ({
          ...prev,
          ...buildCrossDatasetGridAttachment(
            structuresMap,
            dataMessagesMap,
            datasetDimensionsSchemesMap,
            compatibleDataQueries || [],
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
          ),
        }));
        setIsBuildingCrossDatasetGridAttachment(false);
      });

      return () => {
        cancel();
        setIsBuildingCrossDatasetGridAttachment(false);
      };
    }

    setIsBuildingCrossDatasetGridAttachment(false);
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
  ]);

  useEffect(() => {
    const { structuresMap, dataMessagesMap } = structureDataMaps ?? {};

    if (
      structuresMap != null &&
      structuresMap.size > 0 &&
      dataMessagesMap != null &&
      !isLoadingGridData
    ) {
      setCrossDatasetChartAttachment((prev) => ({
        ...prev,
        charting_data: undefined,
        getChartingData: createCrossDatasetChartingDataResolver(
          structuresMap,
          dataMessagesMap,
          compatibleDataQueries || [],
          locale,
          chartStyles,
        ),
      }));
    }
  }, [
    structureDataMaps,
    compatibleDataQueries,
    locale,
    chartStyles,
    isLoadingGridData,
  ]);

  const crossDatasetAttachments = useMemo(
    () => [
      crossDatasetGridAttachment,
      crossDatasetChartAttachment,
      ...codeAttachments,
    ],
    [crossDatasetGridAttachment, crossDatasetChartAttachment, codeAttachments],
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
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap,
        }));

        if (!dataQueries?.length) {
          setIsLoadingGridData(false);
          return;
        }

        dataQueries.forEach((dataQuery) => {
          getDataSetData(
            dataQuery,
            filterParamsMap?.get(dataQuery?.urn) as DatasetQueryFilters,
            getDataSetDataAction,
          )
            .then(({ dataMessage, structureDimensions }) => {
              setIsBuildingCrossDatasetGridAttachment(true);
              setStructureDataMaps((prevStructureDataMaps) => {
                const dataMessagesMap = new Map(
                  prevStructureDataMaps?.dataMessagesMap,
                );
                const structureDimensionsMap = new Map(
                  prevStructureDataMaps?.structureDimensionsMap,
                );

                dataMessagesMap.set(dataQuery.urn, dataMessage);
                structureDimensionsMap.set(
                  dataQuery.urn,
                  structureDimensions || [],
                );

                return {
                  ...prevStructureDataMaps,
                  dataMessagesMap,
                  structureDimensionsMap,
                };
              });
            })
            .finally(() => setIsLoadingGridData(false));
        });

        if (getPythonAttachment && dataQueries?.length) {
          const updatedDataQueries = dataQueries.map((dq) =>
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
      getDataSetDataAction,
      getPythonAttachment,
      titles,
      onCodeAttachmentUpdated,
    ],
  );

  return {
    structureDataMaps,
    datasetDimensionsSchemesMap,
    isLoadingGridData:
      isLoadingGridData || isBuildingCrossDatasetGridAttachment,
    crossDatasetAttachments,
    onMultipleDataFiltersChange,
  };
}
