'use client';

import DataDetails from './DataDetails';
import DatasetInfo from './DatasetInfo';
import Header from './Header';
import { FiltersProps } from '../../models/filters';
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
  ...props
}) => {
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
  );
  const [isFiltering, setIsFiltering] = useState<boolean>();

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
                titles={titles}
                isShowAgency={advanceViewStyles?.isShowAgency}
                locale={locale}
                dataset={dataset}
                data={dataMessage?.data}
                structures={structures}
                metadataSettings={metadataSettings}
                getDatasetUpdatedTime={getDatasetUpdatedTime}
                externalLink={
                  !attachmentsConfig?.isExternaLinkIncludeFilters
                    ? attachmentsProps?.currentDataQuery?.metadata?.datasetUrl
                    : ''
                }
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
                    onFiltersChange,
                    initialConstraints: constraints,
                  }}
                  setIsFiltering={setIsFiltering}
                  attachmentsConfig={attachmentsConfig}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
