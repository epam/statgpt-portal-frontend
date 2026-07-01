/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { Attachment } from '@epam/ai-dial-shared';
import {
  Dataflow,
  DatasetQueryFilters,
  Dimension,
  DownloadType as DownloadTypeOptions,
  generateShortUrn,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import {
  Loader,
  PopUpState,
  RequestLimitMessage,
} from '@epam/statgpt-ui-components';
import {
  isAnyGridAttachment,
  isCrossDatasetGrid,
  isCustomGridAttachment,
} from '../../utils/attachments/attachment-parser';
import {
  AttachmentInfo,
  CrossDatasetGridAttachmentType,
  CustomChartAttachmentType,
  CustomGridAttachment,
} from '../../models/attachments';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import AttachmentDetails from './AttachmentDetails/AttachmentDetails';
import { useAdvancedView } from '../../context/AdvancedViewContext';
import AttachmentCollapsed from './AttachmentCollapsed';
import { AttachmentsActions } from '../../models/actions';
import type { GridApi } from 'ag-grid-community';
import DownloadSettings from '@statgpt/download-panel/src/components/DownloadSettings/DownloadSettings';
import { DownloadDatasetItem } from '@statgpt/download-panel/src/models/download-dataset-item';
import { useConversationViewStyles } from '../../context/ConversationViewStylesContext';
import { useConversationViewFeatureToggles } from '../../context/ConversationViewFeatureTogglesContext';
import DatasetTabs from './Tabs/DatasetTabs/DatasetTabs';
import { getExternalLink } from '../../utils/attachments-details';
import AttachmentsViewModePanel from './AttachmentsViewModePanel';
import AttachmentsContentRenderer from './AttachmentsContentRenderer';
import { DownloadAlert } from './DownloadAlert/DownloadAlert';
import { useAttachmentDownloadFlow } from './useAttachmentDownloadFlow';
import { mergeClasses } from '../../utils/mergeClasses';

interface Props {
  attachments: (
    | Attachment
    | CustomGridAttachment
    | CustomChartAttachmentType
  )[];
  actions: AttachmentsActions;
  isSystemAttachments?: boolean;
  isShowAttachments?: boolean;
  showAdvancedView?: boolean;
  currentDataQuery?: DataQuery;
  dataQueries?: DataQuery[];
  attachmentInfoList?: AttachmentInfo[];
  datasets?: Dataflow[];
  initialSelectedDatasetUrn?: string;
  isDataLoading?: boolean;
  isDataSetAttachments: boolean;
  locale?: string;
  dimensions?: Dimension[];
  filters?: DatasetQueryFilters;
  selectDataset?: (datasetUrn?: string) => void;
  onAdvancedViewOpen?: () => void;
  hideDownloadButton?: boolean;
  containerClassName?: string;
  isTableSettingsOpen?: boolean;
  onTableSettingsOpen?: () => void;
  onTableSettingsClose?: () => void;
  onGridApiReady?: (api: GridApi) => void;
}

export const AttachmentRenderer: FC<Props> = ({
  attachments,
  actions,
  isSystemAttachments,
  isShowAttachments,
  showAdvancedView,
  currentDataQuery,
  dataQueries,
  attachmentInfoList,
  datasets,
  initialSelectedDatasetUrn,
  isDataLoading,
  isDataSetAttachments,
  locale,
  dimensions,
  filters,
  selectDataset,
  onAdvancedViewOpen,
  hideDownloadButton,
  containerClassName,
  isTableSettingsOpen,
  onTableSettingsOpen,
  onTableSettingsClose,
  onGridApiReady,
}) => {
  const {
    titles,
    messageStyles,
    attachmentsStyles,
    limitMessages,
    attachmentsConfig,
  } = useConversationViewStyles();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] =
    useState<number>(0);

  const { isOpenedAdvancedView, setIsOpenedAdvancedView } = useAdvancedView();
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const downloadType = DownloadTypeOptions.DATA_IN_TABLE;

  const enabledDatasets = useMemo(() => {
    if (!isCrossDatasetModeOn || !dataQueries?.some((q) => q.disabled)) {
      return datasets;
    }
    const enabledUrns = new Set(
      dataQueries.filter((q) => !q.disabled).map((q) => q.urn),
    );
    return datasets?.filter((dataset) => {
      const urn = generateShortUrn(
        dataset?.id,
        dataset?.version,
        dataset?.agencyID,
      );
      return enabledUrns.has(urn);
    });
  }, [datasets, dataQueries, isCrossDatasetModeOn]);

  const selectAttachment = (index: number) => {
    setSelectedAttachmentIndex(index);
  };

  const onOpenAdvancedView = useCallback(() => {
    onAdvancedViewOpen?.();
    setIsOpenedAdvancedView(true);
    actions.updateCurrentDataQuery(currentDataQuery || dataQueries?.[0]);
    actions.updateDataQueries(dataQueries);
    actions.updateDatasets(datasets);
  }, [
    actions,
    currentDataQuery,
    dataQueries,
    datasets,
    setIsOpenedAdvancedView,
    onAdvancedViewOpen,
  ]);

  const selectedAttachment = attachments[selectedAttachmentIndex] || null;

  useEffect(() => {
    setShowLoading(
      isDataSetAttachments && (datasets == null || datasets?.length == 0),
    );
  }, [datasets, isDataSetAttachments]);

  useEffect(() => {
    if (
      isTableSettingsOpen &&
      selectedAttachment &&
      !isCustomGridAttachment(selectedAttachment) &&
      !isCrossDatasetGrid(selectedAttachment)
    ) {
      onTableSettingsClose?.();
    }
  }, [isTableSettingsOpen, selectedAttachment, onTableSettingsClose]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const isExternalLinkIncludeFilters =
    attachmentsConfig?.isExternaLinkIncludeFilters;
  const externalLink = getExternalLink(
    isExternalLinkIncludeFilters,
    filters,
    currentDataQuery || dataQueries?.[0],
    dimensions,
  );

  const externalLinksMap = useMemo(() => {
    if (!dataQueries?.length) return undefined;
    const map = new Map(
      dataQueries.map((q) => [
        q.urn,
        getExternalLink(isExternalLinkIncludeFilters, undefined, q),
      ]),
    );
    return map;
  }, [dataQueries, isExternalLinkIncludeFilters]);

  const downloadDatasets = useMemo<DownloadDatasetItem[] | undefined>(() => {
    if (!selectedAttachment || !isCrossDatasetGrid(selectedAttachment))
      return undefined;
    const crossAttachment =
      selectedAttachment as CrossDatasetGridAttachmentType;
    const rows = crossAttachment.gridContent?.data ?? [];

    const urnToCount = new Map<string, number>();
    const urnToName = new Map<string, string>();

    for (const row of rows) {
      const { dataset, datasetTitle: name } = row as {
        dataset?: { urn?: string };
        datasetTitle?: string;
      };
      const urn = dataset?.urn;
      if (!urn) continue;
      urnToCount.set(urn, (urnToCount.get(urn) ?? 0) + 1);
      if (!urnToName.has(urn) && name) urnToName.set(urn, name);
    }

    return Array.from(urnToCount.entries()).map(([urn, rowCount]) => ({
      urn,
      name: urnToName.get(urn) ?? urn,
      rowCount,
      dataQuery: dataQueries?.find((q) => q.urn === urn),
    }));
  }, [selectedAttachment, dataQueries]);

  const downloadRowCount = useMemo(() => {
    if (!selectedAttachment) return undefined;

    if (isCustomGridAttachment(selectedAttachment)) {
      return (selectedAttachment as CustomGridAttachment).grid_data?.data
        ?.length;
    }

    if (isCrossDatasetGrid(selectedAttachment)) {
      return (selectedAttachment as CrossDatasetGridAttachmentType).gridContent
        ?.data?.length;
    }

    return undefined;
  }, [selectedAttachment]);

  const { startDownload, isDownloadRunning, downloadAlertProps } =
    useAttachmentDownloadFlow({
      attachmentsStyles,
      downloadDataSet: actions.downloadDataSet,
    });

  if (!attachments || attachments.length === 0) return null;

  const shouldShowLoader =
    (!isOpenedAdvancedView && showLoading) || !!isDataLoading;

  return (
    <>
      {isOpenedAdvancedView && !isShowAttachments ? (
        <AttachmentCollapsed
          icon={messageStyles?.advanceViewIcon}
          title={
            messageStyles?.openAdvanceViewTitle ?? 'Opened in Advanced view'
          }
        />
      ) : (
        <div
          className={mergeClasses(
            `space-y-3 max-w-full max-h-full h-full`,
            !isOpenedAdvancedView && !isSystemAttachments ? 'pt-5' : 'pt-0',
            `flex flex-col pb-1`,
            containerClassName,
          )}
        >
          {!isOpenedAdvancedView &&
            enabledDatasets?.length != null &&
            enabledDatasets?.length > 0 && (
              <DatasetTabs
                datasets={enabledDatasets}
                initialSelectedDatasetUrn={initialSelectedDatasetUrn}
                locale={locale}
                selectDataset={selectDataset}
              />
            )}
          {shouldShowLoader ? (
            <Loader />
          ) : (
            <>
              {isSystemAttachments && !isOpenedAdvancedView && (
                <AttachmentDetails
                  titles={{
                    queryUpdatedManuallyTitle: titles?.queryUpdatedManually,
                    setToTitle: titles?.setTo,
                    datasetLabel: titles?.dataset,
                  }}
                  datasetIcon={attachmentsStyles?.datasetIcon}
                  attachmentInfoList={attachmentInfoList}
                  dataQueries={dataQueries}
                />
              )}
              {showLimitMessage && (
                <RequestLimitMessage
                  limitMessages={limitMessages}
                  showAdvancedViewButton={
                    !!selectedAttachment &&
                    isAnyGridAttachment(selectedAttachment) &&
                    showAdvancedView
                  }
                  onAdvancedViewClick={onOpenAdvancedView}
                  query={externalLink}
                />
              )}
              <div
                className={classNames(
                  !isOpenedAdvancedView &&
                    datasets?.length &&
                    'attachments-bordered',
                  'attachments-wrapper h-full min-h-0',
                )}
              >
                <div className="flex h-full max-w-full flex-col items-center gap-4">
                  <AttachmentsViewModePanel
                    attachments={attachments}
                    selectedAttachmentIndex={selectedAttachmentIndex}
                    selectedAttachment={selectedAttachment}
                    attachmentsStyles={attachmentsStyles}
                    externalLink={externalLink}
                    isExternalLinkIncludeFilters={isExternalLinkIncludeFilters}
                    limitMessages={limitMessages}
                    onSelectedAttachmentChange={selectAttachment}
                    onDownloadClick={() => setModalState(PopUpState.Opened)}
                    hideDownloadButton={hideDownloadButton}
                    showAdvancedView={showAdvancedView}
                    onOpenAdvancedView={onOpenAdvancedView}
                    isTableSettingsOpen={isTableSettingsOpen}
                    onTableSettingsOpen={onTableSettingsOpen}
                  />
                  {selectedAttachment != null && (
                    <AttachmentsContentRenderer
                      selectedAttachment={selectedAttachment}
                      actions={actions}
                      attachmentsStyles={attachmentsStyles}
                      isDataLoading={isDataLoading}
                      isOpenedAdvancedView={isOpenedAdvancedView}
                      onOpenAdvancedView={onOpenAdvancedView}
                      showLimitMessage={setShowLimitMessage}
                      onGridApiReady={onGridApiReady}
                      externalLink={externalLink}
                      externalLinksMap={externalLinksMap}
                    />
                  )}
                </div>
              </div>
              <>
                {modalState === PopUpState.Opened && (
                  <DownloadSettings
                    onCloseModal={onCloseModal}
                    onDownloadStart={startDownload}
                    isDownloadInProgress={isDownloadRunning}
                    dataQuery={currentDataQuery}
                    datasetName={selectedAttachment?.title || ''}
                    locale={locale}
                    type={downloadType}
                    dimensions={dimensions}
                    filters={filters}
                    urn={currentDataQuery?.urn}
                    titles={attachmentsStyles?.downloadTitles}
                    rowCount={downloadRowCount}
                    collapsible={attachmentsStyles?.downloadCollapsible}
                    downloadDatasets={downloadDatasets}
                    limitMessages={limitMessages}
                    showLimitMessage={showLimitMessage}
                    externalLink={externalLink}
                  />
                )}
                <DownloadAlert {...downloadAlertProps} />
              </>
            </>
          )}
        </div>
      )}
    </>
  );
};
