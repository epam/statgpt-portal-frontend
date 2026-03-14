import { useEffect, useState } from 'react';
import { GetDatasetDetails } from '../types/actions';
import {
  Dataflow,
  generateShortUrn,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import {
  buildRequestCacheKey,
  getCachedRequestResult,
} from '../utils/request-cache';

export function useDatasets(
  getDataSetAction: GetDatasetDetails,
  updateDatasets: (datasets?: Dataflow[]) => void,
  updateDataQueries: (dataQueries?: DataQuery[]) => void,
  updateCurrentDataQuery: (dataQuery?: DataQuery) => void,
  dataQueries?: DataQuery[],
) {
  const [datasets, setDatasets] = useState<Dataflow[]>([]);
  const [datasetStructuresMap, setDatasetStructuresMap] =
    useState<Map<string, StructuralData | undefined>>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function getDatasets(nextDataQueries: DataQuery[]) {
      setIsLoading(true);
      try {
        const structuralData = await Promise.all(
          nextDataQueries.map((query) =>
            getCachedRequestResult(
              getDataSetAction,
              buildRequestCacheKey(query.urn),
              () => getDataSetAction(query.urn),
            ),
          ),
        );

        if (!isActive) {
          return;
        }

        const updatedDatasets =
          structuralData
            ?.map((dataSet) => dataSet?.data?.dataflows?.[0])
            ?.filter((dataSet) => !!dataSet) || [];

        setDatasets(updatedDatasets);
        updateDatasets(updatedDatasets);
        updateDataQueries(nextDataQueries);
        updateCurrentDataQuery(nextDataQueries[0]);

        setDatasetStructuresMap(
          new Map(
            structuralData?.map((dataSet) => [
              generateShortUrn(
                dataSet?.data?.dataflows?.[0]?.id,
                dataSet?.data?.dataflows?.[0]?.version,
                dataSet?.data?.dataflows?.[0]?.agencyID,
              ),
              dataSet?.data,
            ]),
          ),
        );
      } catch (error) {
        console.error('Error loading datasets', error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    if (!dataQueries?.length) {
      setIsLoading(false);
      return;
    }

    getDatasets(dataQueries);

    return () => {
      isActive = false;
    };
  }, [
    dataQueries,
    getDataSetAction,
    updateCurrentDataQuery,
    updateDataQueries,
    updateDatasets,
  ]);

  return {
    datasets,
    datasetStructuresMap,
    isLoading,
  };
}
