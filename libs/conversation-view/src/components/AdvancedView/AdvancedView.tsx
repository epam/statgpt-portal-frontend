'use client';

import DataDetails from './DataDetails';
import DatasetInfo, { DatasetInfoOptions } from './DatasetInfo';
import Header from './Header';
import { Filter, FiltersProps } from '../../models/filters';
import { AttachmentsConfig, AttachmentsProps } from '../../models/attachments';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { MetadataSettings } from '../../models/metadata';
import { Attachment, Message } from '@epam/ai-dial-shared';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttachmentsActions } from '../../models/actions';
import { DataQuery, FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import { Loader, LimitMessages } from '@epam/statgpt-ui-components';
import { useAttachmentsData } from '../../context/AttachmentsData';
import { AdvanceViewStyles } from '../../models/advance-view-styles';
import classNames from 'classnames';
import DatasetTabs from '../Attachments/Tabs/DatasetTabs/DatasetTabs';
import { ConversationViewTitles } from '../../models/titles';
import { StructureComponentValue } from '../../models/structure-component';
import {
  DataConstraints,
  DatasetQueryFilters,
} from '@epam/statgpt-sdmx-toolkit';
import { getExternalLink } from '../../utils/attachments-details';
import { replacePythonAttachment } from '../../utils/attachments/replace-python-attachment';
import { useAttachmentsDataMultipleQueries } from '../../context/AttachmentsDataMultipleQueries';
import { TableSettingsProvider } from './TableSettings/TableSettingsContext';
import { CrossDatasetGridViewMode } from './TableSettings/types';
import { useAdvancedView } from '../../context/AdvancedViewContext';
import { ConversationViewSidePanelOutlet } from '../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useConversationViewFeatureToggles } from '../../context/ConversationViewFeatureTogglesContext';
import { ConversationViewTitlesProvider } from '../../context/ConversationViewTitlesContext';
import { useCrossDatasetAttachments } from '../../context/CrossDatasetAttachmentsContext';
import { useDatasetDimensionsMetadataMap } from '../../context/DatasetDimensionsMetadataMapContext';
import {
  getCrossDatasetSnapshotKey,
  getRestoredActiveDatasetUrns,
} from '../../utils/multiple-filters';

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
  const currentUrn = useMemo(
    () =>
      attachmentsProps.currentDataQuery?.urn ??
      attachmentsProps.dataQueries?.[0]?.urn ??
      'default',
    [attachmentsProps.currentDataQuery?.urn, attachmentsProps.dataQueries],
  );

  const [gridViewMode, setGridViewMode] = useState(
    CrossDatasetGridViewMode.Compact,
  );

  const { isOpenedAdvancedView } = useAdvancedView();
  const {
    activeDatasetUrns: sharedActiveDatasetUrns,
    dataQueriesKey: sharedCrossDatasetDataQueriesKey,
    setCrossDatasetAttachmentsState,
  } = useCrossDatasetAttachments();
  const { isCrossDatasetModeOn, isMetadataInSidePanel } =
    useConversationViewFeatureToggles();
  const datasetDimensionsMetadata = useDatasetDimensionsMetadataMap();
  const shouldShowDatasetInfo = !isMetadataInSidePanel;
  const datasets = attachmentsProps.datasets ?? [];
  const showDatasetTabs = datasets.length > 1 && !isCrossDatasetModeOn;

  const lastMessageAttachments =
    props.filtersProps.conversation?.messages?.at(-1)?.custom_content
      ?.attachments;
  const crossDatasetDataQueriesKey = useMemo(
    () => getCrossDatasetSnapshotKey(attachmentsProps.dataQueries),
    [attachmentsProps.dataQueries],
  );
  const initialActiveDatasetUrns =
    sharedCrossDatasetDataQueriesKey === crossDatasetDataQueriesKey
      ? sharedActiveDatasetUrns
      : getRestoredActiveDatasetUrns(
          attachmentsProps.dataQueries,
          datasetDimensionsMetadata.map,
        );

  const conversationRef = useRef(props.filtersProps.conversation);
  conversationRef.current = props.filtersProps.conversation;

  const handleCodeAttachmentUpdated = useCallback(
    (newRawAttachment: Attachment) => {
      const conversation = conversationRef.current;
      if (!conversation) return;
      const updatedMessages = replacePythonAttachment(
        conversation.messages as Message[],
        newRawAttachment,
      );
      if (!updatedMessages) return;
      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
      };
      props.filtersProps.setConversation?.(updatedConversation);
      props.filtersProps.updateConversation(
        decodeURI(props.filtersProps.conversationKey),
        {
          name: updatedConversation.name,
          messages: updatedConversation.messages,
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
    undefined,
    false,
    handleCodeAttachmentUpdated,
  );
  const {
    structureDataMaps,
    crossDatasetAttachments,
    activeDatasetUrns,
    isLoadingGridData: isLoadingCrossDsGridData,
    onMultipleDataFiltersChange,
  } = useAttachmentsDataMultipleQueries(
    actions,
    locale,
    attachmentsProps.dataQueries,
    attachmentsProps.styles?.chartingStyles,
    formattingSettings,
    metadataSettings,
    lastMessageAttachments,
    initialActiveDatasetUrns,
    handleCodeAttachmentUpdated,
    gridViewMode,
  );

  useEffect(() => {
    if (!isCrossDatasetModeOn || !attachmentsProps.dataQueries?.length) {
      setCrossDatasetAttachmentsState();
      return;
    }

    if (!structureDataMaps) {
      return;
    }

    setCrossDatasetAttachmentsState({
      attachments: crossDatasetAttachments,
      dataQueriesKey: crossDatasetDataQueriesKey,
      activeDatasetUrns: activeDatasetUrns
        ? Array.from(activeDatasetUrns)
        : undefined,
      isLoading: isLoadingCrossDsGridData,
    });
  }, [
    activeDatasetUrns,
    attachmentsProps.dataQueries?.length,
    crossDatasetAttachments,
    crossDatasetDataQueriesKey,
    isCrossDatasetModeOn,
    isLoadingCrossDsGridData,
    setCrossDatasetAttachmentsState,
    structureDataMaps,
  ]);
  const [isFiltering, setIsFiltering] = useState<boolean>();
  const [filters, setFilters] = useState<DatasetQueryFilters>({
    filterKey: null,
    timeFilter: null,
  });
  const [filtersMap, setFiltersMap] =
    useState<Map<string, DatasetQueryFilters>>();

  const isDataLoading = useMemo(
    () => (isCrossDatasetModeOn ? isLoadingCrossDsGridData : isLoadingGridData),
    [isCrossDatasetModeOn, isLoadingCrossDsGridData, isLoadingGridData],
  );

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

  const handleMultipleDataFiltersChange = useCallback(
    (
      filterParamsMap: Map<string, DatasetQueryFilters>,
      constraintsMap?: Map<string, DataConstraints[] | undefined>,
      dataQueries?: DataQuery[],
      filtersMap?: Map<string, Filter[]>,
      filters?: Filter[],
    ): void => {
      setFiltersMap(filterParamsMap);
      setIsFiltering(true);
      onMultipleDataFiltersChange(
        filterParamsMap,
        constraintsMap,
        dataQueries,
        filtersMap,
        filters,
      );
    },
    [onMultipleDataFiltersChange],
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
    <ConversationViewTitlesProvider titles={titles}>
      <TableSettingsProvider
        currentUrn={currentUrn}
        structuresMap={structureDataMaps?.structuresMap}
        locale={locale}
        dataQueries={attachmentsProps?.dataQueries}
        gridViewMode={gridViewMode}
        onGridViewModeChange={setGridViewMode}
      >
        <div className="advanced-view flex h-full min-w-0 flex-1 flex-col">
          <Header
            titles={titles}
            locale={locale}
            shareConversationProps={shareConversationProps}
            isShowShare={advanceViewStyles?.isShowShare}
          />
          {!datasets.length ? (
            <Loader />
          ) : (
            <>
              {showDatasetTabs && (
                <DatasetTabs
                  datasets={datasets}
                  initialSelectedDatasetUrn={
                    attachmentsProps?.currentDataQuery?.urn
                  }
                  locale={locale}
                  isHideAdvancedViewButton={true}
                  selectDataset={onSelectDataset}
                />
              )}
              {isDataLoading && !isFiltering ? (
                <Loader />
              ) : (
                <>
                  {shouldShowDatasetInfo && (
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
                  )}
                  <div
                    className={classNames(
                      'flex flex-1 min-h-0 overflow-auto',
                      shouldShowDatasetInfo && 'border-t border-neutrals-500',
                    )}
                  >
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
                        attachments={
                          isCrossDatasetModeOn
                            ? crossDatasetAttachments
                            : dataSetAttachments
                        }
                        attachmentsDataQuery={attachmentsProps.currentDataQuery}
                        dataQueries={attachmentsProps?.dataQueries}
                        dimensions={dimensions}
                        attachmentsStyles={attachmentsProps.styles}
                        isDataLoading={isDataLoading}
                        locale={locale}
                        filtersProps={{
                          ...props?.filtersProps,
                          structureDimensions,
                          structures,
                          structureDataMaps,
                          onFiltersChange,
                          onMultipleDataFiltersChange:
                            handleMultipleDataFiltersChange,
                          initialConstraints: constraints,
                        }}
                        setIsFiltering={setIsFiltering}
                        attachmentsConfig={attachmentsConfig}
                        filters={filters}
                        filtersMap={filtersMap}
                        onFiltersChange={handleFiltersChange}
                      />
                    </div>
                    {isOpenedAdvancedView && (
                      <ConversationViewSidePanelOutlet scope="advanced" />
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </TableSettingsProvider>
    </ConversationViewTitlesProvider>
  );
};
