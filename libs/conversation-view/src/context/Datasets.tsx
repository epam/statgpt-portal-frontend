import { useEffect, useState } from 'react';
import { GetDatasetDetails } from '../types/actions';
import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { generateShortUrn } from '@statgpt/sdmx-toolkit/src/utils/urn';

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
