'use client';

import { generateShortUrn, getLocalizedName } from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { IconButton } from '@epam/statgpt-ui-components';
import classNames from 'classnames';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import type { DatasetTabsProps } from './DatasetTabs';
import { useAdvancedView } from '../../../../context/AdvancedViewContext';
import { Tooltip } from '../../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../../constants/onboarding-elements';
import { useOnboarding } from '../../../../context/OnboardingContext';

const MAX_TABS_COUNT = 3;

const DatasetTabsCrossMode: FC<DatasetTabsProps> = ({
  datasets,
  locale,
  isHideAdvancedViewButton,
  openAdvancedViewIcon,
  initialSelectedDatasetUrn,
  selectDataset,
  onOpenAdvancedView,
  titles,
}) => {
  const { isOpenedAdvancedView } = useAdvancedView();
  const [selectedDatasetUrn, setSelectedDatasetUrn] = useState<string>();

  const iconRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();

  useEffect(() => {
    if (isShowOnboarding) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.OPEN_ADVANCED_VIEW,
        titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [titles, isShowOnboarding]);

  useEffect(() => {
    if (isShowOnboarding) {
      const isCurrent =
        onboardingFileSchema?.lastDisplayedElement ===
        OnboardingElements.OPEN_ADVANCED_VIEW;
      setIsTooltipVisible(isCurrent);

      if (isCurrent) {
        iconRef?.current?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }
    }
  }, [onboardingFileSchema?.lastDisplayedElement, isShowOnboarding]);

  useEffect(() => {
    if (!initialSelectedDatasetUrn && !selectedDatasetUrn && datasets?.[0]) {
      const datasetUrn = generateShortUrn(
        datasets[0].id,
        datasets[0].version,
        datasets[0].agencyID,
      );
      setSelectedDatasetUrn(datasetUrn);
      selectDataset?.(datasetUrn);
    } else if (
      initialSelectedDatasetUrn &&
      initialSelectedDatasetUrn !== selectedDatasetUrn
    ) {
      setSelectedDatasetUrn(initialSelectedDatasetUrn);
      selectDataset?.(initialSelectedDatasetUrn);
    }
  }, [datasets, selectDataset, initialSelectedDatasetUrn, selectedDatasetUrn]);

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
    <div
      className={classNames(
        'cross-dataset-tabs flex justify-between items-center w-full',
        isHideAdvancedViewButton &&
          isOpenedAdvancedView &&
          'hide-advance-button',
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
      {!isHideAdvancedViewButton && (
        <div ref={iconRef}>
          <IconButton
            buttonClassName={'advanced-view-button-cross-dataset-mode'}
            icon={openAdvancedViewIcon}
            onClick={onOpenAdvancedView}
          />
        </div>
      )}
      {isTooltipVisible && (
        <Tooltip
          reference={iconRef}
          title={tooltipTitle}
          description={tooltipDescription}
          onReferenceClick={onOpenAdvancedView}
          shouldCloseTooltip={isOpenedAdvancedView}
        />
      )}
    </div>
  );
};

export default DatasetTabsCrossMode;
