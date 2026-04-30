import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DataConstraints,
  DatasetDimensionsScheme,
  DatasetQueryFilters,
  getLocalizedName,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery, FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import {
  getConstraints,
  GetDatasetData,
  GetDatasetDetails,
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
import { Attachment } from '@epam/ai-dial-shared';
import { useConversationViewTitles } from './ConversationViewTitlesContext';
import {
  ChartingStyles,
  useDatasetDimensionsMetadataMap,
} from '@epam/statgpt-conversation-view';
import { buildCrossDatasetGridAttachment } from '../utils/attachments/cross-dataset-grid/build-cross-dataset-grid-attachment';
import { MetadataSettings } from '../models/metadata';
import { StructureDataMaps } from '../models/structure-data';
import { buildChartData } from '../utils/attachments/charting/chart-data';

export function useAttachmentsDataMultipleQueries(
  actions: {
    getDataSet: GetDatasetDetails;
    getDataSetData: GetDatasetData;
    getConstraints: getConstraints;
  },
  locale: string,
  dataQueries?: DataQuery[],
  chartStyles?: ChartingStyles,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  rawAttachments?: Attachment[],
  initialActiveDatasetUrns?: string[],
) {
  const [structureDataMaps, setStructureDataMaps] =
    useState<StructureDataMaps>();
  const titles = useConversationViewTitles();
  const [datasetDimensionsSchemesMap, setDatasetDimensionsSchemesMap] =
    useState<Map<string, DatasetDimensionsScheme | undefined>>();
  const [isLoadingGridData, setIsLoadingGridData] = useState(false);
  const [activeDatasetUrns, setActiveDatasetUrns] =
    useState<Set<string> | null>(
      initialActiveDatasetUrns ? new Set(initialActiveDatasetUrns) : null,
    );

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
  } = actions;

  const dataQueriesRef = useRef(dataQueries);
  dataQueriesRef.current = dataQueries;
  const initialActiveDatasetUrnsRef = useRef(initialActiveDatasetUrns);
  initialActiveDatasetUrnsRef.current = initialActiveDatasetUrns;

  const dataQueriesUrnsKey = useMemo(
    () => dataQueries?.map((q) => q.urn).join(',') ?? '',
    [dataQueries],
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
      const initialActiveDatasetUrns = initialActiveDatasetUrnsRef.current;
      setActiveDatasetUrns(
        initialActiveDatasetUrns ? new Set(initialActiveDatasetUrns) : null,
      );
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
      setCodeAttachments(
        buildMarkdownAttachments(
          rawAttachments,
          undefined,
          titles?.codeSamples,
        ),
      );
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
      const visibleDataQueries = activeDatasetUrns
        ? (dataQueries || []).filter((q) => activeDatasetUrns.has(q.urn))
        : dataQueries || [];
      const visibleStructuresMap = activeDatasetUrns
        ? new Map([...structuresMap].filter(([k]) => activeDatasetUrns.has(k)))
        : structuresMap;
      const visibleDataMessagesMap = activeDatasetUrns
        ? new Map(
            [...dataMessagesMap].filter(([k]) => activeDatasetUrns.has(k)),
          )
        : dataMessagesMap;
      const visibleDimensionsSchemesMap = activeDatasetUrns
        ? new Map(
            [...datasetDimensionsSchemesMap].filter(([k]) =>
              activeDatasetUrns.has(k),
            ),
          )
        : datasetDimensionsSchemesMap;
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
        ),
      }));
    }
  }, [
    structureDataMaps,
    dataQueries,
    locale,
    formattingSettings,
    metadataSettings,
    chartStyles,
    titles,
    datasetDimensionsSchemesMap,
    isLoadingGridData,
    activeDatasetUrns,
  ]);

  useEffect(() => {
    const { structuresMap, dataMessagesMap } = structureDataMaps ?? {};

    if (
      structuresMap != null &&
      structuresMap.size > 0 &&
      dataMessagesMap != null &&
      !isLoadingGridData
    ) {
      const visibleDataQueries = activeDatasetUrns
        ? (dataQueries || []).filter((q) => activeDatasetUrns.has(q.urn))
        : dataQueries || [];
      const chartGroups = visibleDataQueries.flatMap((dataQuery) => {
        const structures = structuresMap.get(dataQuery.urn);
        const dataMessage = dataMessagesMap.get(dataQuery.urn);

        if (!structures || !dataMessage) {
          return [];
        }

        const datasetName = getLocalizedName(structures.dataflows?.[0], locale);

        return [
          {
            title: datasetName,
            units: buildChartData(
              structures,
              dataMessage,
              dataQuery,
              locale,
              chartStyles,
            ).units,
          },
        ];
      });

      setCrossDatasetChartAttachment((prev) => ({
        ...prev,
        charting_data: {
          units: chartGroups.flatMap((group) => group.units),
          groups: chartGroups,
        },
      }));
    }
  }, [
    structureDataMaps,
    dataQueries,
    locale,
    chartStyles,
    isLoadingGridData,
    activeDatasetUrns,
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
      compatibleDataQueries?: DataQuery[],
    ): void => {
      try {
        setIsLoadingGridData(true);
        const compatibleUrns = new Set(
          compatibleDataQueries?.map((q) => q.urn),
        );
        setActiveDatasetUrns(compatibleUrns);
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap,
        }));

        if (!compatibleDataQueries?.length) {
          setIsLoadingGridData(false);
          return;
        }

        compatibleDataQueries.forEach((dataQuery) => {
          getDataSetData(
            dataQuery,
            filterParamsMap?.get(dataQuery?.urn) as DatasetQueryFilters,
            getDataSetDataAction,
          )
            .then(({ dataMessage, structureDimensions }) => {
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
      } catch (err) {
        console.error('Error loading dataset data', err as object);
      }
    },
    [getDataSetDataAction],
  );

  return {
    structureDataMaps,
    datasetDimensionsSchemesMap,
    isLoadingGridData,
    crossDatasetAttachments,
    activeDatasetUrns,
    onMultipleDataFiltersChange,
  };
}
