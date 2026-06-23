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
import { getLastMessageWithAttachmentIndex } from '../../utils/messages';
import { useAttachmentsDataMultipleQueries } from '../../context/AttachmentsDataMultipleQueries';
import { TableSettingsProvider } from './TableSettings/TableSettingsContext';
import { CrossDatasetGridViewMode } from './TableSettings/types';
import { useAdvancedView } from '../../context/AdvancedViewContext';
import { ConversationViewSidePanelOutlet } from '../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useConversationViewFeatureToggles } from '../../context/ConversationViewFeatureTogglesContext';
import { ConversationViewStylesProvider } from '../../context/ConversationViewStylesContext';
import { FiltersModalStateProvider } from '../../context/FiltersModalStateContext';
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
  limitMessages,
  ...props
}) => {
  const currentUrn = useMemo(
    () =>
      attachmentsProps.currentDataQuery?.urn ??
      attachmentsProps.dataQueries?.[0]?.urn ??
      'default',
    [attachmentsProps.currentDataQuery?.urn, attachmentsProps.dataQueries],
  );

  const enabledDataQueries = useMemo(
    () => attachmentsProps?.dataQueries?.filter((q) => !q.disabled),
    [attachmentsProps?.dataQueries],
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

  const lastMessageAttachments = useMemo(() => {
    const messages = props.filtersProps.conversation?.messages ?? [];
    const idx = getLastMessageWithAttachmentIndex(messages);
    return idx >= 0 ? messages[idx].custom_content?.attachments : undefined;
  }, [props.filtersProps.conversation?.messages]);
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
  const skipSingleDatasetConstraintsLoading =
    isCrossDatasetModeOn && !!attachmentsProps.dataQueries?.length;

  const conversationRef = useRef(props.filtersProps.conversation);
  conversationRef.current = props.filtersProps.conversation;

  const handleCodeAttachmentUpdated = useCallback(
    (newRawAttachment: Attachment, datasetUrn?: string) => {
      const conversation = conversationRef.current;
      if (!conversation) return;
      const updatedMessages = replacePythonAttachment(
        conversation.messages as Message[],
        newRawAttachment,
        undefined,
        datasetUrn,
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
    skipSingleDatasetConstraintsLoading,
  );
  const shouldRenderDatasetInfo = shouldShowDatasetInfo && !!dataset;
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
    titles,
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
  const [filters, setFilters] = useState<DatasetQueryFilters>({
    filterKey: null,
    timeFilter: null,
  });
  const [isFiltering, setIsFiltering] = useState<boolean>();
  const isDataLoading = isCrossDatasetModeOn
    ? isLoadingCrossDsGridData
    : isLoadingGridData;
  const attachments = isCrossDatasetModeOn
    ? crossDatasetAttachments
    : dataSetAttachments;

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
    <ConversationViewStylesProvider
      styles={{
        titles,
        attachmentsStyles: attachmentsProps.styles,
        formattingSettings,
        limitMessages,
        attachmentsConfig,
      }}
    >
      <TableSettingsProvider
        currentUrn={currentUrn}
        structuresMap={structureDataMaps?.structuresMap}
        locale={locale}
        dataQueries={enabledDataQueries}
        gridViewMode={gridViewMode}
        onGridViewModeChange={setGridViewMode}
        texts={{
          columnsDisplayTitle: attachmentsProps.styles?.columnsDisplayTitle,
          columnsSearchPlaceholder:
            attachmentsProps.styles?.columnsSearchPlaceholder,
          compactViewTitle: attachmentsProps.styles?.compactViewTitle,
          compactViewDescription:
            attachmentsProps.styles?.compactViewDescription,
          extendedViewTitle: attachmentsProps.styles?.extendedViewTitle,
          extendedViewDescription:
            attachmentsProps.styles?.extendedViewDescription,
        }}
        resetIcon={attachmentsProps.styles?.tableSettingsResetIcon}
      >
        <FiltersModalStateProvider>
          <div className="advanced-view flex h-full min-w-0 flex-1 flex-col">
            <Header
              locale={locale}
              shareConversationProps={shareConversationProps}
              isShowShare={advanceViewStyles?.isShowShare}
              conversation={props.filtersProps.conversation}
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
                    selectDataset={onSelectDataset}
                  />
                )}
                {isDataLoading && !isFiltering ? (
                  <Loader />
                ) : (
                  <>
                    {shouldRenderDatasetInfo && (
                      <DatasetInfo
                        {...datasetInfoOptions}
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
                        shouldRenderDatasetInfo &&
                          'border-t border-neutrals-500',
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
                          actions={actions}
                          attachments={attachments}
                          attachmentsDataQuery={
                            attachmentsProps.currentDataQuery
                          }
                          dataQueries={attachmentsProps?.dataQueries}
                          dimensions={dimensions}
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
                          filters={filters}
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
        </FiltersModalStateProvider>
      </TableSettingsProvider>
    </ConversationViewStylesProvider>
  );
};
