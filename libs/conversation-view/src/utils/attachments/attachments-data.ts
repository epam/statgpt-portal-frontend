import { DataQuery } from '@epam/statgpt-shared-toolkit';
import {
  DataConstraints,
  Dataflow,
  DataMessage,
  DatasetQueryFilters,
  Dimension,
  getDimensions,
  getFiltersDtoMapFromDataQuery,
  getStructureDimensions,
  getTimeSeriesFilterKey,
  StructuralData,
  StructureItemBase,
} from '@epam/statgpt-sdmx-toolkit';
import {
  getConstraints,
  GetDatasetData,
  GetDatasetDetails,
} from '../../types/actions';
import { getTimeQueryFilterFromAttachment } from '../query-filters';
import { DatasetData, StructureData } from '../../models/structure-data';

export const getDataConstraintsMap = async (
  dataQueries: DataQuery[],
  getConstraintsAction: getConstraints,
): Promise<Map<string, DataConstraints[]>> => {
  const constraintsMap = new Map<string, DataConstraints[]>();
  const filtersDtoMap = getFiltersDtoMapFromDataQuery(dataQueries);

  for (const dataQuery of dataQueries) {
    const response = await getConstraintsAction(
      dataQuery.urn,
      filtersDtoMap?.get(dataQuery.urn),
    );
    constraintsMap?.set(dataQuery.urn, response?.data?.dataConstraints || []);
  }
  return constraintsMap;
};

const initStructureData = (): StructureData => ({
  datasetsMap: new Map<string, Dataflow>(),
  dataMessagesMap: new Map<string, DataMessage>(),
  structuresMap: new Map<string, StructuralData>(),
  dimensionsMap: new Map<string, Dimension[]>(),
  structureDimensionsMap: new Map<string, StructureItemBase[]>(),
});

export const getStructureData = async (
  dataQueries: DataQuery[],
  getDataSetAction: GetDatasetDetails,
  getDataSetDataAction: GetDatasetData,
  setIsLoadingGridData: (isLoading: boolean) => void,
): Promise<StructureData> => {
  const structureData = initStructureData();

  await Promise.all(
    dataQueries.map(async (dataQuery) => {
      const dataSet = await getDataSetAction(dataQuery.urn);
      if (dataSet?.data) {
        const dimensions = getDimensions(dataSet.data);

        structureData.datasetsMap?.set(
          dataQuery?.urn,
          dataSet?.data?.dataflows?.[0],
        );
        structureData.structuresMap?.set(dataQuery?.urn, dataSet?.data);
        structureData.dimensionsMap?.set(dataQuery?.urn, [
          ...(dimensions?.dimensions || []),
          ...(dimensions?.timeDimensions || []),
        ]);

        const filterKey =
          dimensions?.dimensions == null
            ? null
            : getTimeSeriesFilterKey(dimensions?.dimensions, dataQuery.filters);

        const timeFilter = getTimeQueryFilterFromAttachment(
          dataQuery,
          dimensions,
        );

        await getDataSetData(
          dataQuery,
          { filterKey, timeFilter },
          getDataSetDataAction,
        )
          .then(({ dataMessage, structureDimensions }) => {
            structureData?.dataMessagesMap?.set(dataQuery.urn, dataMessage);
            structureData?.structureDimensionsMap?.set(
              dataQuery.urn,
              structureDimensions || [],
            );
          })
          .finally(() => setIsLoadingGridData(false));
      }
    }),
  );
  return structureData;
};

export const getDataSetData = async (
  dataQuery: DataQuery,
  filterParams: DatasetQueryFilters,
  getDataSetDataAction: GetDatasetData,
): Promise<DatasetData> => {
  return getDataSetDataAction(dataQuery.urn, filterParams).then((data) => {
    return {
      dataMessage: data,
      structureDimensions: getStructureDimensions(data),
    };
  });
};
