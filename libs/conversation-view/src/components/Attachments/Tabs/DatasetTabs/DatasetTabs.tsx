'use client';

import {
  Dataflow,
  generateShortUrn,
  getLocalizedName,
} from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { IconButton } from '@epam/statgpt-ui-components';
import classNames from 'classnames';
import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DatasetTab from './DatasetTab';
import { useAdvancedView } from '../../../../context/AdvancedViewContext';
import { Tooltip } from '../../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../../utils/get-tooltip-data.by-element';
import { ConversationViewTitles } from '../../../../models/titles';
import { OnboardingElements } from '../../../../constants/onboarding-elements';
import { useOnboarding } from '../../../../context/OnboardingContext';
import { useCrossDatasetMode } from '../../../../context/CrossDatasetModeContext';

interface Props {
  datasets?: Dataflow[];
  locale?: string;
  isHideAdvancedViewButton?: boolean;
  openAdvancedViewIcon?: ReactNode;
  initialSelectedDatasetUrn?: string;
  titles?: ConversationViewTitles;
  selectDataset?: (datasetUrn?: string) => void;
  onOpenAdvancedView?: () => void;
}

const MAX_TABS_COUNT_CROSS_DATASET = 3;

const DatasetTabs: FC<Props> = ({
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
  const { isCrossDatasetModeOn } = useCrossDatasetMode();
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

  const onSelectDataset = useCallback(
    (datasetUrn?: string) => {
      setSelectedDatasetUrn(datasetUrn);
      selectDataset?.(datasetUrn);
    },
    [selectDataset],
  );

  const datasetItems = useMemo(
    () =>
      (datasets || []).map((dataset) => ({
        urn: generateShortUrn(dataset?.id, dataset?.version, dataset?.agencyID),
        title: getLocalizedName(dataset, locale || Locale.EN),
      })),
    [datasets, locale],
  );

  const visibleDatasetItems = useMemo(() => {
    if (datasetItems.length <= MAX_TABS_COUNT_CROSS_DATASET) {
      return datasetItems;
    }

    const selectedDataset = datasetItems.find(
      (dataset) => dataset.urn === initialSelectedDatasetUrn,
    );

    if (!selectedDataset) {
      return datasetItems.slice(0, MAX_TABS_COUNT_CROSS_DATASET);
    }

    return [
      selectedDataset,
      ...datasetItems.filter((dataset) => dataset.urn !== selectedDataset.urn),
    ].slice(0, MAX_TABS_COUNT_CROSS_DATASET);
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
        'dataset-tabs flex justify-between items-center w-full',
        isCrossDatasetModeOn && 'dataset-tabs-cross-dataset-mode',
        isHideAdvancedViewButton &&
          isOpenedAdvancedView &&
          'hide-advance-button',
      )}
    >
      {isCrossDatasetModeOn ? (
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
      ) : (
        <div className="flex items-center w-full overflow-y-auto gap-4 sm:w-[calc(100%-30px)]">
          {datasets?.map((dataset) => (
            <DatasetTab
              key={dataset?.id}
              id={dataset?.id}
              title={getLocalizedName(dataset, locale || Locale.EN)}
              version={dataset?.version}
              agency={dataset?.agencyID}
              isActive={
                datasets?.length > 1 &&
                selectedDatasetUrn ===
                  generateShortUrn(
                    dataset?.id,
                    dataset?.version,
                    dataset?.agencyID,
                  )
              }
              isSingleTab={datasets?.length === 1}
              onSelectDataset={onSelectDataset}
            />
          ))}
        </div>
      )}
      {!isHideAdvancedViewButton && (
        <div ref={iconRef}>
          <IconButton
            buttonClassName={classNames(
              'advanced-view-button',
              isCrossDatasetModeOn && 'advanced-view-button-cross-dataset-mode',
            )}
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

export default DatasetTabs;
