import {
  Dataflow,
  generateShortUrn,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { useEffect, useState } from 'react';
import { GetDatasetDetails } from '../types/actions';

export function useDatasets(
  getDataSetAction: GetDatasetDetails,
  dataQueries?: DataQuery[],
) {
  const [datasets, setDatasets] = useState<Dataflow[]>([]);
  const [datasetStructuresMap, setDatasetStructuresMap] =
    useState<Map<string, StructuralData | undefined>>();

  useEffect(() => {
    function getDatasets(dataQueries: DataQuery[]) {
      try {
        Promise.all(
          dataQueries?.map((query) => getDataSetAction(query?.urn)),
        ).then((structuralData) => {
          setDatasets(
            structuralData
              ?.map((dataSet) => dataSet?.data?.dataflows?.[0])
              ?.filter((dataSet) => !!dataSet) || [],
          );
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
        });
      } catch (error) {
        console.error('Error loading datasets', error);
      }
    }

    if (dataQueries && dataQueries.length) {
      getDatasets(dataQueries);
    }
  }, [dataQueries, getDataSetAction]);

  return {
    datasets,
    datasetStructuresMap,
  };
}
