import { useEffect, useState } from 'react';
import { GetDatasetDetails } from '../types/actions';
import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { SdmxReferences } from '@statgpt/sdmx-toolkit/src/types/references';

export function useDatasets(
  getDataSetAction: GetDatasetDetails,
  dataQueries?: DataQuery[],
) {
  const [datasets, setDatasets] = useState<Dataflow[]>([]);

  useEffect(() => {
    function getDatasets(dataQueries: DataQuery[]) {
      try {
        Promise.all(
          dataQueries?.map((query) =>
            getDataSetAction(query?.urn, SdmxReferences.NONE),
          ),
        ).then((dataSets) => {
          setDatasets(
            dataSets
              ?.map((dataSet) => dataSet?.data?.dataflows?.[0])
              ?.filter((dataSet) => !!dataSet) || [],
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
  };
}
