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
import { DatasetData, StructureDataMaps } from '../../models/structure-data';

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

const initStructureDataMaps = (): StructureDataMaps => ({
  datasetsMap: new Map<string, Dataflow>(),
  dataMessagesMap: new Map<string, DataMessage>(),
  structuresMap: new Map<string, StructuralData>(),
  dimensionsMap: new Map<string, Dimension[]>(),
  structureDimensionsMap: new Map<string, StructureItemBase[]>(),
});

export const getStructureDataMaps = async (
  dataQueries: DataQuery[],
  getDataSetAction: GetDatasetDetails,
  getDataSetDataAction: GetDatasetData,
): Promise<StructureDataMaps> => {
  const structureDataMaps = initStructureDataMaps();

  await Promise.all(
    dataQueries.map(async (dataQuery) => {
      const dataSet = await getDataSetAction(dataQuery.urn);
      if (dataSet?.data) {
        const dimensions = getDimensions(dataSet.data);

        structureDataMaps.datasetsMap?.set(
          dataQuery?.urn,
          dataSet?.data?.dataflows?.[0],
        );
        structureDataMaps.structuresMap?.set(dataQuery?.urn, dataSet?.data);
        structureDataMaps.dimensionsMap?.set(dataQuery?.urn, [
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
        ).then(({ dataMessage, structureDimensions }) => {
          structureDataMaps?.dataMessagesMap?.set(dataQuery.urn, dataMessage);
          structureDataMaps?.structureDimensionsMap?.set(
            dataQuery.urn,
            structureDimensions || [],
          );
        });
      }
    }),
  );
  return structureDataMaps;
};

const getDataSetData = async (
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
