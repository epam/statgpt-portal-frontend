import { useEffect, useState } from 'react';
import { GetDatasetDetails } from '../types/actions';
import {
  Dataflow,
  generateShortUrn,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

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

  useEffect(() => {
    function getDatasets(dataQueries: DataQuery[]) {
      try {
        Promise.all(
          dataQueries.map((query) => getDataSetAction(query.urn)),
        ).then((structuralData) => {
          const sets =
            structuralData
              ?.map((dataSet) => dataSet?.data?.dataflows?.[0])
              ?.filter((dataSet) => !!dataSet) || [];

          setDatasets(sets);
          updateDatasets(sets);
          updateDataQueries(dataQueries);
          updateCurrentDataQuery(dataQueries?.[0]);

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
  };
}
