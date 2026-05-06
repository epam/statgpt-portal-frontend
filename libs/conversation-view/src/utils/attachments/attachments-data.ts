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
import { buildRequestCacheKey, getCachedRequestResult } from '../request-cache';
import { normalizeConstraintFilters } from '../normalize-constraint-filters';

export const getDataConstraintsMap = async (
  dataQueries: DataQuery[],
  getConstraintsAction: getConstraints,
): Promise<Map<string, DataConstraints[]>> => {
  const constraintsMap = new Map<string, DataConstraints[]>();
  const filtersDtoMap = getFiltersDtoMapFromDataQuery(dataQueries);

  const settledConstraints = await Promise.allSettled(
    dataQueries.map(async (dataQuery) => {
      const filtersDto = normalizeConstraintFilters(
        filtersDtoMap?.get(dataQuery.urn) || [],
      );
      return {
        urn: dataQuery.urn,
        response: await getCachedRequestResult(
          getConstraintsAction,
          buildRequestCacheKey(dataQuery.urn, filtersDto),
          () => getConstraintsAction(dataQuery.urn, filtersDto),
        ),
      };
    }),
  );

  settledConstraints.forEach((result) => {
    if (result.status === 'fulfilled') {
      const constraints = result.value.response?.data?.dataConstraints;

      if (Array.isArray(constraints)) {
        constraintsMap.set(result.value.urn, constraints);
      }
    }
  });

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
  setIsLoadingGridData: (isLoading: boolean) => void,
  getFilterParamsMap?: (
    structureDataMaps: StructureDataMaps,
  ) =>
    | Map<string, DatasetQueryFilters>
    | undefined
    | Promise<Map<string, DatasetQueryFilters> | undefined>,
): Promise<StructureDataMaps> => {
  const structureDataMaps = initStructureDataMaps();

  await Promise.allSettled(
    dataQueries.map(async (dataQuery) => {
      const dataSet = await getCachedRequestResult(
        getDataSetAction,
        buildRequestCacheKey(dataQuery.urn),
        () => getDataSetAction(dataQuery.urn),
      );

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
      }
    }),
  );

  const filterParamsMap = await getFilterParamsMap?.(structureDataMaps);

  await Promise.allSettled(
    dataQueries.map(async (dataQuery) => {
      const dataSet = structureDataMaps.structuresMap?.get(dataQuery.urn);

      if (!dataSet) {
        return;
      }

      if (filterParamsMap && !filterParamsMap.has(dataQuery.urn)) {
        return;
      }

      const dimensions = getDimensions(dataSet);
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

      await getDataSetData(
        dataQuery,
        filterParamsMap?.get(dataQuery.urn) ?? { filterKey, timeFilter },
        getDataSetDataAction,
      )
        .then(({ dataMessage, structureDimensions }) => {
          structureDataMaps?.dataMessagesMap?.set(dataQuery.urn, dataMessage);
          structureDataMaps?.structureDimensionsMap?.set(
            dataQuery.urn,
            structureDimensions || [],
          );
        })
        .catch(() => {
          structureDataMaps?.structureDimensionsMap?.set(dataQuery.urn, []);
        })
        .finally(() => setIsLoadingGridData(false));
    }),
  );

  return structureDataMaps;
};

export const getDataSetData = async (
  dataQuery: DataQuery,
  filterParams: DatasetQueryFilters,
  getDataSetDataAction: GetDatasetData,
): Promise<DatasetData> => {
  const data = await getCachedRequestResult(
    getDataSetDataAction,
    buildRequestCacheKey(dataQuery.urn, filterParams),
    () => getDataSetDataAction(dataQuery.urn, filterParams),
  );
  return {
    dataMessage: data,
    structureDimensions: getStructureDimensions(data),
  };
};
