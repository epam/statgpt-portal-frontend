'use client';

import DataDetails from '@statgpt/conversation-view/src/components/AdvancedView/DataDetails';
import DatasetInfo from '@statgpt/conversation-view/src/components/AdvancedView/DatasetInfo';
import Header from '@statgpt/conversation-view/src/components/AdvancedView/Header';
import { FiltersProps } from '@statgpt/conversation-view/src/models/filters';
import { AttachmentsProps } from '@statgpt/conversation-view/src/models/attachments';
import { ShareConversationProps } from '@statgpt/conversation-view/src/models/share-conversation';
import { MetadataSettings } from '@statgpt/conversation-view/src/models/metadata';
import { FC, useCallback, useState } from 'react';
import { AttachmentsActions } from '@statgpt/conversation-view/src/models/actions';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';
import { useAttachmentsData } from '@statgpt/conversation-view/src/context/AttachmentsData';
import { AdvanceViewStyles } from '@statgpt/conversation-view/src/models/advance-view-styles';
import classNames from 'classnames';
import DatasetTabs from '@statgpt/conversation-view/src/components/Attachments/Tabs/DatasetTabs/DatasetTabs';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

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
}

const AdvancedView: FC<Props> = ({
  attachmentsProps,
  actions,
  titles,
  shareConversationProps,
  metadataSettings,
  formattingSettings,
  locale,
  advanceViewStyles,
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
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdvancedView;
