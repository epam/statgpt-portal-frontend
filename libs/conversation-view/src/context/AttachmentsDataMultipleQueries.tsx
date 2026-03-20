import { useCallback, useEffect, useState } from 'react';
import {
  DataConstraints,
  Dataflow,
  DataMessage,
  DatasetDimensionsScheme,
  Dimension,
  StructuralData,
  StructureItemBase,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery, FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import {
  getConstraints,
  GetDatasetData,
  GetDatasetDetails,
} from '../types/actions';
import {
  getDataConstraintsMap,
  getStructureDataMaps,
} from '../utils/attachments/attachments-data';
import { CustomGridAttachment } from '../models/attachments';
import { createInitialCrossDatasetGridAttachment } from '../constants/attachments';
import { useConversationViewTitles } from './ConversationViewTitlesContext';
import {
  ChartingStyles,
  useDatasetDimensionsMetadataMap,
} from '@epam/statgpt-conversation-view';
import { buildCrossDatasetGridAttachment } from '../utils/attachments/cross-dataset-grid/build-cross-dataset-grid-attachment';
import { MetadataSettings } from '../models/metadata';

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
) {
  const titles = useConversationViewTitles();
  const [dataMessagesMap, setDataMessagesMap] =
    useState<Map<string, DataMessage | null>>();
  const [datasetsMap, setDatasetsMap] =
    useState<Map<string, Dataflow | undefined>>();
  const [constraintsMap, setConstraintsMap] =
    useState<Map<string, DataConstraints[]>>();
  const [structuresMap, setStructuresMap] =
    useState<Map<string, StructuralData | undefined>>();
  const [dimensionsMap, setDimensionsMap] =
    useState<Map<string, Dimension[]>>();
  const [structureDimensionsMap, setStructureDimensionsMap] =
    useState<Map<string, StructureItemBase[]>>();
  const [datasetDimensionsSchemesMap, setDatasetDimensionsSchemesMap] =
    useState<Map<string, DatasetDimensionsScheme | undefined>>();
  const [isLoadingGridData, setIsLoadingGridData] = useState(false);

  const [crossDatasetGridAttachment, setCrossDatasetGridAttachment] =
    useState<CustomGridAttachment>(
      createInitialCrossDatasetGridAttachment(titles?.dataGrid),
    );

  const loadConstraintsMap = useCallback(
    async (dataQueries: DataQuery[]) => {
      try {
        const constraintsMap = await getDataConstraintsMap(
          dataQueries,
          actions.getConstraints,
        );
        setConstraintsMap(constraintsMap);
      } catch {
        setConstraintsMap(new Map<string, DataConstraints[]>());
      }
    },
    [actions, setConstraintsMap],
  );

  const loadStructureData = useCallback(
    async (dataQueries: DataQuery[]) => {
      const structureDataMaps = await getStructureDataMaps(
        dataQueries,
        actions.getDataSet,
        actions.getDataSetData,
        setIsLoadingGridData,
      );

      setDatasetsMap(structureDataMaps?.datasetsMap);
      setStructuresMap(structureDataMaps?.structuresMap);
      setDimensionsMap(structureDataMaps?.dimensionsMap);
      setDataMessagesMap(structureDataMaps?.dataMessagesMap);
      setStructureDimensionsMap(structureDataMaps?.structureDimensionsMap);
    },
    [actions],
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
    if (
      structuresMap != null &&
      structuresMap.size > 0 &&
      dataMessagesMap != null &&
      constraintsMap != null &&
      datasetDimensionsSchemesMap != null &&
      !isLoadingGridData
    ) {
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
    }
  }, [
    structuresMap,
    dataMessagesMap,
    constraintsMap,
    dataQueries,
    locale,
    formattingSettings,
    metadataSettings,
    chartStyles,
    titles,
    datasetDimensionsSchemesMap,
    isLoadingGridData,
  ]);

  return {
    dataMessagesMap,
    structuresMap,
    datasetsMap,
    dimensionsMap,
    structureDimensionsMap,
    constraintsMap,
    datasetDimensionsSchemesMap,
    isLoadingGridData,
    crossDatasetGridAttachment,
  };
}
