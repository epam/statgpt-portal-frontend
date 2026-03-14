'use client';

import DataDetails from './DataDetails';
import DatasetInfo, { DatasetInfoOptions } from './DatasetInfo';
import Header from './Header';
import { Filter, FiltersProps } from '../../models/filters';
import { AttachmentsConfig, AttachmentsProps } from '../../models/attachments';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { MetadataSettings } from '../../models/metadata';
import { FC, useCallback, useState } from 'react';
import { AttachmentsActions } from '../../models/actions';
import { FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import { Loader } from '@epam/statgpt-ui-components';
import { useAttachmentsData } from '../../context/AttachmentsData';
import { AdvanceViewStyles } from '../../models/advance-view-styles';
import classNames from 'classnames';
import DatasetTabs from '../Attachments/Tabs/DatasetTabs/DatasetTabs';
import { ConversationViewTitles } from '../../models/titles';
import { StructureComponentValue } from '../../models/structure-component';
import { LimitMessages } from '@epam/statgpt-ui-components';
import {
  DataConstraints,
  DatasetQueryFilters,
} from '@epam/statgpt-sdmx-toolkit';
import { getExternalLink } from '../../utils/attachments-details';
import { useAttachmentsDataMultipleQueries } from '../../context/AttachmentsDataMultipleQueries';

interface Props {
  filtersProps: FiltersProps;
  attachmentsProps: AttachmentsProps;
  shareConversationProps?: ShareConversationProps;
  metadataSettings?: MetadataSettings;
  actions: AttachmentsActions;
  formattingSettings?: FormatNumbersType;
  locale: string;
  titles?: ConversationViewTitles;
  advanceViewStyles?: AdvanceViewStyles;
  getDatasetUpdatedTime?: (
    attributes: StructureComponentValue[],
  ) => string | null;
  limitMessages?: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
  datasetInfoOptions?: DatasetInfoOptions;
}

export const AdvancedView: FC<Props> = ({
  attachmentsProps,
  actions,
  titles,
  shareConversationProps,
  metadataSettings,
  formattingSettings,
  locale,
  advanceViewStyles,
  getDatasetUpdatedTime,
  attachmentsConfig,
  datasetInfoOptions,
  ...props
}) => {
  const lastMessageAttachments =
    props.filtersProps.conversation?.messages?.at(-1)?.custom_content
      ?.attachments;

  const {
    dataMessage,
    dataset,
    dimensions,
    structureDimensions,
    structures,
    dataSetAttachments,
    onFiltersChange,
    isLoadingGridData,
    constraints,
  } = useAttachmentsData(
    actions,
    locale,
    attachmentsProps.currentDataQuery,
    formattingSettings,
    attachmentsProps.styles?.chartingStyles,
    metadataSettings,
    titles,
    lastMessageAttachments,
  );
  const {
    dimensionsMap,
    structuresMap,
    structureDimensionsMap,
    constraintsMap,
  } = useAttachmentsDataMultipleQueries(actions, attachmentsProps.dataQueries);
  const [isFiltering, setIsFiltering] = useState<boolean>();
  const [filters, setFilters] = useState<DatasetQueryFilters>({
    filterKey: null,
    timeFilter: null,
  });

  const handleFiltersChange = useCallback(
    (
      filterParams: DatasetQueryFilters,
      constraints: DataConstraints[],
      modalFilters?: Filter[],
    ) => {
      setFilters(filterParams);
      setIsFiltering(true);
      onFiltersChange(filterParams, constraints, modalFilters);
    },
    [onFiltersChange],
  );

  const onSelectDataset = useCallback(
    (datasetUrn?: string) => {
      if (datasetUrn) {
        actions?.updateCurrentDataQuery(
          attachmentsProps?.dataQueries?.find(
            (query) => query?.urn === datasetUrn,
          ) || attachmentsProps.currentDataQuery,
        );
      }
    },
    [actions, attachmentsProps.currentDataQuery, attachmentsProps?.dataQueries],
  );

  const externalLink = getExternalLink(
    attachmentsConfig?.isExternaLinkIncludeFilters,
    filters,
    attachmentsProps.currentDataQuery || attachmentsProps.dataQueries?.[0],
    dimensions,
  );

  return (
    <div className="advanced-view flex flex-col flex-1 h-full min-w-0">
      <Header
        titles={titles}
        locale={locale}
        shareConversationProps={shareConversationProps}
        isShowShare={advanceViewStyles?.isShowShare}
      />
      {!attachmentsProps?.datasets?.length ? (
        <Loader />
      ) : (
        <>
          {attachmentsProps?.datasets?.length > 1 && (
            <DatasetTabs
              datasets={attachmentsProps?.datasets}
              initialSelectedDatasetUrn={
                attachmentsProps?.currentDataQuery?.urn
              }
              locale={locale}
              isHideAdvancedViewButton={true}
              selectDataset={onSelectDataset}
            />
          )}
          {isLoadingGridData && !isFiltering ? (
            <Loader />
          ) : (
            <>
              <DatasetInfo
                {...datasetInfoOptions}
                titles={titles}
                locale={locale}
                dataset={dataset}
                data={dataMessage?.data}
                structures={structures}
                metadataSettings={metadataSettings}
                getDatasetUpdatedTime={getDatasetUpdatedTime}
                externalLink={externalLink}
              />
              <div
                className={classNames(
                  'flex-1 min-h-0 overflow-auto',
                  'advanced-view-filters',
                )}
              >
                <DataDetails
                  {...props}
                  titles={titles}
                  actions={actions}
                  attachments={dataSetAttachments}
                  attachmentsDataQuery={attachmentsProps.currentDataQuery}
                  dataQueries={attachmentsProps?.dataQueries}
                  dimensions={dimensions}
                  attachmentsStyles={attachmentsProps.styles}
                  isDataLoading={isLoadingGridData}
                  locale={locale}
                  filtersProps={{
                    ...props?.filtersProps,
                    structureDimensions,
                    structures,
                    dimensionsMap,
                    structureDimensionsMap,
                    structuresMap,
                    onFiltersChange,
                    initialConstraints: constraints,
                    initialConstraintsMap: constraintsMap,
                  }}
                  setIsFiltering={setIsFiltering}
                  attachmentsConfig={attachmentsConfig}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
