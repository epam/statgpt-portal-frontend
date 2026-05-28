'use client';

import { generateShortUrn, getLocalizedName } from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import classNames from 'classnames';
import { FC, useMemo } from 'react';
import type { DatasetTabsProps } from './DatasetTabs';
import { useAdvancedView } from '../../../../context/AdvancedViewContext';

const MAX_TABS_COUNT = 3;

const DatasetTabsCrossMode: FC<DatasetTabsProps> = ({ datasets, locale }) => {
  const { isOpenedAdvancedView } = useAdvancedView();

  const datasetItems = useMemo(
    () =>
      (datasets || []).map((dataset) => ({
        urn: generateShortUrn(dataset?.id, dataset?.version, dataset?.agencyID),
        title: getLocalizedName(dataset, locale || Locale.EN),
      })),
    [datasets, locale],
  );

  const visibleDatasetItems = useMemo(
    () => datasetItems.slice(0, MAX_TABS_COUNT),
    [datasetItems],
  );

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
    <div
      className={classNames(
        'cross-dataset-tabs flex w-full items-center justify-between',
        isOpenedAdvancedView && 'hide-advance-button',
      )}
    >
      <div className="cross-dataset-tabs-list sm:w-[calc(100%-30px)]">
        {visibleDatasetItems.map((dataset, index) => {
          return (
            <span key={dataset.urn} className="cross-dataset-tabs-item-wrapper">
              <span className="cross-dataset-tabs-item" title={dataset.title}>
                {dataset.title}
              </span>
              {index < visibleDatasetItems.length - 1 && (
                <span
                  className="cross-dataset-tabs-separator"
                  aria-hidden="true"
                />
              )}
            </span>
          );
        })}
        {hiddenDatasetsCount > 0 && (
          <span
            className="cross-dataset-tabs-counter"
            title={hiddenDatasetTitles}
          >
            +{hiddenDatasetsCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default DatasetTabsCrossMode;
