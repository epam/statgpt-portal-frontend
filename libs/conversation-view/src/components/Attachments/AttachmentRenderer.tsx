/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { Attachment } from '@epam/ai-dial-shared';
import {
  Dataflow,
  DatasetQueryFilters,
  Dimension,
  DownloadType as DownloadTypeOptions,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import {
  Alert,
  AlertDetails,
  Loader,
  PopUpState,
  LimitMessages,
  RequestLimitMessage,
} from '@epam/statgpt-ui-components';
import {
  isGridAttachment,
} from '../../utils/attachments/attachment-parser';
import {
  AttachmentInfo,
  AttachmentsConfig,
  CustomChartAttachmentType,
  CustomGridAttachment,
} from '../../models/attachments';
import { FC, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import AttachmentDetails from './AttachmentDetails/AttachmentDetails';
import { useAdvancedView } from '../../context/AdvancedViewContext';
import AttachmentCollapsed from './AttachmentCollapsed';
import { MessageStyles } from '../../models/message';
import { AttachmentsActions } from '../../models/actions';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AttachmentsStyles } from '../../models/attachments-styles';
import DownloadSettings from '@statgpt/download-panel/src/components/DownloadSettings/DownloadSettings';
import { ConversationViewTitles } from '../../models/titles';
import DatasetTabs from './Tabs/DatasetTabs/DatasetTabs';
import { getExternalLink } from '../../utils/attachments-details';
import AttachmentsViewModePanel from './AttachmentsViewModePanel';
import AttachmentsContentRenderer from './AttachmentsContentRenderer';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  attachments: (
    | Attachment
    | CustomGridAttachment
    | CustomChartAttachmentType
  )[];
  actions: AttachmentsActions;
  messageStyles?: MessageStyles;
  isSystemAttachments?: boolean;
  isShowAttachments?: boolean;
  showAdvancedView?: boolean;
  attachmentsStyles?: AttachmentsStyles;
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
  titles?: ConversationViewTitles;
  selectDataset?: (datasetUrn?: string) => void;
  onAdvancedViewOpen?: () => void;
  limitMessages?: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
}

const AttachmentRenderer: FC<Props> = ({
  attachments,
  actions,
  titles,
  messageStyles,
  attachmentsStyles,
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
  limitMessages,
  attachmentsConfig,
}) => {
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] =
    useState<number>(0);
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);

  const { isOpenedAdvancedView, setIsOpenedAdvancedView } = useAdvancedView();
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [isShowDownloadAlert, setIsShowDownloadAlert] = useState<boolean>();
  const [downloadAlertDetails, setDownloadAlertDetails] =
    useState<AlertDetails>();

  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const downloadActions = {
    downloadDataSet: actions.downloadDataSet,
    getConstraints: actions.getConstraints,
  };
  const downloadType = DownloadTypeOptions.DATA_IN_TABLE;

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

  useEffect(() => {
    setSelectedAttachment(attachments[selectedAttachmentIndex] || null);
  }, [attachments, selectedAttachmentIndex]);

  useEffect(() => {
    setShowLoading(
      isDataSetAttachments && (datasets == null || datasets?.length == 0),
    );
  }, [datasets, isDataSetAttachments]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const isExternaLinkIncludeFilters =
    attachmentsConfig?.isExternaLinkIncludeFilters;
  const externalLink = getExternalLink(
    isExternaLinkIncludeFilters,
    filters,
    currentDataQuery || dataQueries?.[0],
    dimensions,
  );

  if (!attachments || attachments.length === 0) return null;

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
          className={classNames(
            `space-y-3 max-w-full max-h-full h-full`,
            !isOpenedAdvancedView && !isSystemAttachments ? 'pt-5' : 'pt-0',
          )}
        >
          {!isOpenedAdvancedView && showLoading ? (
            <Loader />
          ) : (
            <>
              {isSystemAttachments && !isOpenedAdvancedView && (
                <AttachmentDetails
                  titles={{
                    queryUpdatedManuallyTitle: titles?.queryUpdatedManually,
                    setToTitle: titles?.setTo,
                  }}
                  datasetIcon={attachmentsStyles?.datasetIcon}
                  attachmentInfoList={attachmentInfoList}
                />
              )}
              {!isOpenedAdvancedView &&
                datasets?.length != null &&
                datasets?.length > 0 && (
                  <DatasetTabs
                    datasets={datasets}
                    initialSelectedDatasetUrn={initialSelectedDatasetUrn}
                    locale={locale}
                    titles={titles}
                    isHideAdvancedViewButton={!showAdvancedView}
                    openAdvancedViewIcon={
                      attachmentsStyles?.openAdvancedViewIcon
                    }
                    selectDataset={selectDataset}
                    onOpenAdvancedView={onOpenAdvancedView}
                  />
                )}
              {showLimitMessage && (
                <RequestLimitMessage
                  limitMessages={limitMessages}
                  showAdvancedViewButton={
                    !!selectedAttachment &&
                    isGridAttachment(selectedAttachment) &&
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
                <div className="flex flex-col max-w-full items-center gap-4 h-full">
                  <AttachmentsViewModePanel
                    attachments={attachments}
                    selectedAttachmentIndex={selectedAttachmentIndex}
                    selectedAttachment={selectedAttachment}
                    attachmentsStyles={attachmentsStyles}
                    titles={titles}
                    externalLink={externalLink}
                    isExternaLinkIncludeFilters={isExternaLinkIncludeFilters}
                    limitMessages={limitMessages}
                    onSelectedAttachmentChange={selectAttachment}
                    onDownloadClick={() => setModalState(PopUpState.Opened)}
                  />
                  {selectedAttachment != null && (
                    <AttachmentsContentRenderer
                      selectedAttachment={selectedAttachment}
                      actions={actions}
                      attachmentsStyles={attachmentsStyles}
                      titles={titles}
                      isDataLoading={isDataLoading}
                      isOpenedAdvancedView={isOpenedAdvancedView}
                      onOpenAdvancedView={onOpenAdvancedView}
                      showLimitMessage={setShowLimitMessage}
                    />
                  )}
                </div>
              </div>
            </>
          )}
          <>
            {modalState === PopUpState.Opened && (
              <DownloadSettings
                actions={downloadActions}
                onCloseModal={onCloseModal}
                dataQuery={currentDataQuery}
                datasetName={selectedAttachment?.title || ''}
                locale={locale}
                type={downloadType}
                dimensions={dimensions}
                filters={filters}
                urn={currentDataQuery?.urn}
                datasetIcon={attachmentsStyles?.datasetIcon}
                isDisplayDatasetIcon={attachmentsStyles?.isDisplayDatasetIcon}
                titles={attachmentsStyles?.downloadTitles}
                setIsShowDownloadAlert={setIsShowDownloadAlert}
                setDownloadAlertDetails={setDownloadAlertDetails}
                limitMessages={limitMessages}
                showLimitMessage={showLimitMessage}
                externalLink={externalLink}
              />
            )}
            {isShowDownloadAlert && (
              <Alert
                alertDetails={downloadAlertDetails}
                successIcon={attachmentsStyles?.successDownloadIcon}
                errorIcon={attachmentsStyles?.errorDownloadIcon}
                onClose={() => setIsShowDownloadAlert(false)}
                closeButtonTitle={attachmentsStyles?.closeTitle || 'Close'}
              />
            )}
          </>
        </div>
      )}
    </>
  );
};

export default AttachmentRenderer;
