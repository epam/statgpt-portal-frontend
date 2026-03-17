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
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import {
  getConstraints,
  GetDatasetData,
  GetDatasetDetails,
} from '../types/actions';
import {
  getDataConstraintsMap,
  getStructureData,
} from '../utils/attachments/attachments-data';
import { useDatasetDimensionsMetadataMap } from '@epam/statgpt-conversation-view';

export function useAttachmentsDataMultipleQueries(
  actions: {
    getDataSet: GetDatasetDetails;
    getDataSetData: GetDatasetData;
    getConstraints: getConstraints;
  },
  dataQueries?: DataQuery[],
) {
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
      const structureData = await getStructureData(
        dataQueries,
        actions.getDataSet,
        actions.getDataSetData,
        setIsLoadingGridData,
      );

      setDatasetsMap(structureData?.datasetsMap);
      setStructuresMap(structureData?.structuresMap);
      setDimensionsMap(structureData?.dimensionsMap);
      setDataMessagesMap(structureData?.dataMessagesMap);
      setStructureDimensionsMap(structureData?.structureDimensionsMap);
    },
    [actions],
  );

  const { getDimensionsScheme } = useDatasetDimensionsMetadataMap();

  const loadDimensionsSchemes = useCallback((dataQueries: DataQuery[]) => {
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
  }, []);

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
  }, [dataQueries, loadConstraintsMap, loadStructureData]);

  return {
    dataMessagesMap,
    structuresMap,
    datasetsMap,
    dimensionsMap,
    structureDimensionsMap,
    constraintsMap,
    datasetDimensionsSchemesMap,
    isLoadingGridData,
  };
}
