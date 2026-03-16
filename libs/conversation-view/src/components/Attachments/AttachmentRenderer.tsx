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
  Button,
  Loader,
  PopUpState,
  LimitMessages,
  RequestLimitMessage,
  CopyButton,
} from '@epam/statgpt-ui-components';
import FileAttachment from './BaseAttachments/FileAttachment';
import MarkdownAttachment from './BaseAttachments/MarkdownAttachment';
import UrlAttachment from './BaseAttachments/UrlAttachment';
import {
  isCustomCodeSampleAttachment,
  isCustomChartAttachment,
  isCustomGridAttachment,
  isFileAttachment,
  isGridAttachment,
  isMarkdownAttachment,
  isUrlAttachment,
} from '../../utils/attachments/attachment-parser';
import {
  AttachmentInfo,
  AttachmentsConfig,
  CustomChartAttachmentType,
  CustomGridAttachment,
} from '../../models/attachments';
import { FC, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import AttachmentTabs from './Tabs/AttachmentTabs/AttachmentTabs';
import AttachmentDetails from './AttachmentDetails/AttachmentDetails';
import GridAttachment from './BaseAttachments/GridAttachment';
import { useAdvancedView } from '../../context/AdvancedViewContext';
import AttachmentCollapsed from './AttachmentCollapsed';
import { MessageStyles } from '../../models/message';
import { AttachmentsActions } from '../../models/actions';
import { AllCommunityModule, GridApi, ModuleRegistry } from 'ag-grid-community';
import CustomDataGridAttachment from './CustomAttachments/CustomGridAttachment';
import { AttachmentsStyles } from '../../models/attachments-styles';
import CustomChartAttachment from './CustomAttachments/CustomChartAttachment';
import DownloadSettings from '@statgpt/download-panel/src/components/DownloadSettings/DownloadSettings';
import { ConversationViewTitles } from '../../models/titles';
import DatasetTabs from './Tabs/DatasetTabs/DatasetTabs';
import { getExternalLink } from '../../utils/attachments-details';
import { CodeAttachment } from './CustomAttachments/CodeAttachment';
import ColumnsIcon from '../../assets/icons/columns.svg';

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
  isTableSettingsOpen?: boolean;
  onTableSettingsOpen?: () => void;
  onGridApiReady?: (api: GridApi) => void;
  onTableSettingsClose?: () => void;
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
  isTableSettingsOpen,
  onTableSettingsOpen,
  onGridApiReady,
  onTableSettingsClose,
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

  useEffect(() => {
    if (
      isTableSettingsOpen &&
      selectedAttachment &&
      !isCustomGridAttachment(selectedAttachment)
    ) {
      onTableSettingsClose?.();
    }
  }, [isTableSettingsOpen, selectedAttachment, onTableSettingsClose]);

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
                  <div className="flex min-w-0 w-full justify-between items-center">
                    <AttachmentTabs
                      dataGridTitle={attachmentsStyles?.dataGridTitle}
                      attachments={attachments}
                      selectedAttachmentIndex={selectedAttachmentIndex}
                      showTabIcon={attachmentsStyles?.showTabIcon}
                      onSelectedAttachmentChange={selectAttachment}
                      titles={titles}
                    />
                    <div className="flex gap-x-3 items-center flex-wrap w-fit justify-end">
                      {selectedAttachment &&
                        isCustomGridAttachment(selectedAttachment) &&
                        isExternaLinkIncludeFilters && (
                          <a href={externalLink} target="_blank">
                            <Button
                              title={
                                limitMessages?.dataExplorer || 'Data explorer'
                              }
                              buttonClassName="text-button-tertiary small-icon-button [&>svg]:h-[16px] [&>svg]:w-[16px] whitespace-nowrap"
                              iconBefore={limitMessages?.dataExplorerIcon}
                            />
                          </a>
                        )}
                      {!showAdvancedView &&
                        selectedAttachment &&
                        isCustomGridAttachment(selectedAttachment) && (
                        <Button
                          disabled={isTableSettingsOpen}
                          buttonClassName="text-button-tertiary !p-0 !h-6"
                          textClassName="ml-1"
                          iconBefore={<ColumnsIcon className="size-4" />}
                          title="Columns"
                          onClick={onTableSettingsOpen}
                        />
                      )}
                      {selectedAttachment &&
                        isCustomGridAttachment(selectedAttachment) && (
                          <Button
                            title={
                              attachmentsStyles?.downloadTitle || 'Download'
                            }
                            buttonClassName="text-button-tertiary small-icon-button !p-0 !h-6"
                            textClassName="ml-1"
                            onClick={() => setModalState(PopUpState.Opened)}
                            iconBefore={attachmentsStyles?.downloadIcon}
                          />
                        )}
                      {selectedAttachment &&
                        isCustomCodeSampleAttachment(selectedAttachment) && (
                          <CopyButton
                            title={attachmentsStyles?.copyTitle}
                            copiedTitle={attachmentsStyles?.copiedTitle}
                            tooltip={attachmentsStyles?.copiedTooltip}
                            icon={attachmentsStyles?.copyIcon}
                            copiedIcon={attachmentsStyles?.copiedIcon}
                            onClick={() =>
                              navigator.clipboard.writeText(
                                selectedAttachment.data ?? '',
                              )
                            }
                          />
                        )}
                    </div>
                  </div>
                  {selectedAttachment != null && (
                    <div className="flex flex-1 w-full justify-center min-h-0">
                      {isFileAttachment(selectedAttachment) && (
                        <FileAttachment
                          actions={actions}
                          downloadTitles={attachmentsStyles?.downloadTitle}
                          attachment={selectedAttachment}
                        />
                      )}
                      {isGridAttachment(selectedAttachment) && (
                        <GridAttachment
                          actions={actions}
                          attachment={selectedAttachment}
                          showLimitMessage={setShowLimitMessage}
                        />
                      )}
                      {isCustomGridAttachment(selectedAttachment) && (
                        <CustomDataGridAttachment
                          attachment={selectedAttachment}
                          isDataLoading={isDataLoading}
                          chartColumn={isOpenedAdvancedView}
                          fixHeight={!isOpenedAdvancedView}
                          titles={titles}
                          showLimitMessage={setShowLimitMessage}
                          onApiReady={onGridApiReady}
                        />
                      )}
                      {isCustomChartAttachment(selectedAttachment) && (
                        <CustomChartAttachment
                          titles={titles}
                          isDataLoading={isDataLoading}
                          attachment={selectedAttachment}
                          icons={attachmentsStyles?.chartingIcons}
                          openAdvancedView={
                            !isOpenedAdvancedView ? onOpenAdvancedView : void 0
                          }
                          fixHeight={!isOpenedAdvancedView}
                        />
                      )}
                      {isUrlAttachment(selectedAttachment) && (
                        <UrlAttachment
                          attachment={selectedAttachment}
                          openLinkTitle={attachmentsStyles?.openLinkTitle}
                        />
                      )}
                      {isMarkdownAttachment(selectedAttachment) && (
                        <MarkdownAttachment attachment={selectedAttachment} />
                      )}
                      {isCustomCodeSampleAttachment(selectedAttachment) && (
                        <CodeAttachment
                          attachment={selectedAttachment}
                          className={
                            attachmentsStyles?.codeAttachmentContainerClassName
                          }
                        />
                      )}
                    </div>
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
