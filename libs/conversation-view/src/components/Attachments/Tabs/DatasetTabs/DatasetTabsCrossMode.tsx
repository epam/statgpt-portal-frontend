'use client';

import {
  Dataflow,
  generateShortUrn,
  getLocalizedName,
} from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { FC, useMemo } from 'react';

interface Props {
  datasets?: Dataflow[];
  locale?: string;
  initialSelectedDatasetUrn?: string;
}

const MAX_TABS_COUNT = 3;

const DatasetTabsCrossMode: FC<Props> = ({
  datasets,
  locale,
  initialSelectedDatasetUrn,
}) => {
  const datasetItems = useMemo(
    () =>
      (datasets || []).map((dataset) => ({
        urn: generateShortUrn(dataset?.id, dataset?.version, dataset?.agencyID),
        title: getLocalizedName(dataset, locale || Locale.EN),
      })),
    [datasets, locale],
  );

  const visibleDatasetItems = useMemo(() => {
    if (datasetItems.length <= MAX_TABS_COUNT) {
      return datasetItems;
    }

    const selectedDataset = datasetItems.find(
      (dataset) => dataset.urn === initialSelectedDatasetUrn,
    );

    if (!selectedDataset) {
      return datasetItems.slice(0, MAX_TABS_COUNT);
    }

    return [
      selectedDataset,
      ...datasetItems.filter((dataset) => dataset.urn !== selectedDataset.urn),
    ].slice(0, MAX_TABS_COUNT);
  }, [datasetItems, initialSelectedDatasetUrn]);

  const hiddenDatasetsCount = Math.max(
    datasetItems.length - visibleDatasetItems.length,
    0,
  );
  const hiddenDatasetTitles = datasetItems
    .filter(
      (dataset) =>
        !visibleDatasetItems.some(
          (visibleDataset) => visibleDataset.urn === dataset.urn,
        ),
    )
    .map((dataset) => dataset.title)
    .join('\n');

  return (
    <div className="dataset-tabs-list sm:w-[calc(100%-30px)]">
      {visibleDatasetItems.map((dataset, index) => {
        return (
          <span key={dataset.urn} className="dataset-tabs-item-wrapper">
            <span className="dataset-tabs-item" title={dataset.title}>
              {dataset.title}
            </span>
            {index < visibleDatasetItems.length - 1 && (
              <span className="dataset-tabs-separator" aria-hidden="true" />
            )}
          </span>
        );
      })}
      {hiddenDatasetsCount > 0 && (
        <span className="dataset-tabs-counter" title={hiddenDatasetTitles}>
          +{hiddenDatasetsCount}
        </span>
      )}
    </div>
  );
};

export default DatasetTabsCrossMode;
