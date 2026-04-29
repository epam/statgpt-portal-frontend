import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DataConstraints,
  DatasetDimensionsScheme,
  DatasetQueryFilters,
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
import { createCrossDatasetChartingDataResolver } from '../utils/attachments/charting/cross-dataset-chart-data';
import { scheduleDeferredWork } from '../utils/deferred-work';

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

  const loadConstraintsMap = useCallback(
    async (dataQueries: DataQuery[]) => {
      try {
        const constraintsMap = await getDataConstraintsMap(
          dataQueries,
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
    async function loadDataSets(dataQueries: DataQuery[]) {
      setIsLoadingGridData(true);

      try {
        loadDimensionsSchemes(dataQueries);
        await Promise.all([
          loadConstraintsMap(dataQueries),
          loadStructureData(dataQueries),
        ]);
      } catch (err) {
        console.error('Error loading dataset details', err as object);
      } finally {
        setIsLoadingGridData(false);
      }
    }

    if (dataQueries?.length) {
      loadDataSets(dataQueries);
    }
  }, [
    dataQueries,
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
      setIsBuildingCrossDatasetGridAttachment(true);

      const cancel = scheduleDeferredWork(() => {
        setCrossDatasetGridAttachment((prev) => ({
          ...prev,
          ...buildCrossDatasetGridAttachment(
            structuresMap,
            dataMessagesMap,
            datasetDimensionsSchemesMap,
            dataQueries || [],
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
    dataQueries,
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
          dataQueries || [],
          locale,
          chartStyles,
        ),
      }));
    }
  }, [structureDataMaps, dataQueries, locale, chartStyles, isLoadingGridData]);

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
    ): void => {
      try {
        setIsLoadingGridData(true);
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap,
        }));
        dataQueries?.forEach((dataQuery) => {
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
      } catch (err) {
        console.error('Error loading dataset data', err as object);
      }
    },
    [getDataSetDataAction],
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
