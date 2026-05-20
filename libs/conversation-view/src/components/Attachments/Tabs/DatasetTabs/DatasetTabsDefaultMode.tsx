'use client';

import { generateShortUrn, getLocalizedName } from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { IconButton } from '@epam/statgpt-ui-components';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import DatasetTab from './DatasetTab';
import type { DatasetTabsProps } from './DatasetTabs';
import { useAdvancedView } from '../../../../context/AdvancedViewContext';
import { Tooltip } from '../../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../../constants/onboarding-elements';
import { useOnboarding } from '../../../../context/OnboardingContext';
import { useConversationViewStyles } from '../../../../context/ConversationViewStylesContext';

const DatasetTabsDefaultMode: FC<DatasetTabsProps> = ({
  datasets,
  locale,
  isHideAdvancedViewButton,
  openAdvancedViewIcon,
  initialSelectedDatasetUrn,
  selectDataset,
  onOpenAdvancedView,
}) => {
  const { titles } = useConversationViewStyles();
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

  const onSelectDataset = useCallback(
    (datasetUrn?: string) => {
      setSelectedDatasetUrn(datasetUrn);
      selectDataset?.(datasetUrn);
    },
    [selectDataset],
  );

  return (
    <div
      className={classNames(
        'dataset-tabs flex justify-between items-center w-full',
        isHideAdvancedViewButton &&
          isOpenedAdvancedView &&
          'hide-advance-button',
      )}
    >
      <div className="flex w-full items-center gap-4 overflow-y-auto sm:w-[calc(100%-30px)]">
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
      {!isHideAdvancedViewButton && (
        <div ref={iconRef}>
          <IconButton
            buttonClassName={'advanced-view-button'}
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

export default DatasetTabsDefaultMode;
