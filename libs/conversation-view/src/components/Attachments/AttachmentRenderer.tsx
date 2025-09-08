'use client';

import FileAttachment from '@statgpt/conversation-view/src/components/Attachments/BaseAttachments/FileAttachment';
import MarkdownAttachment from '@statgpt/conversation-view/src/components/Attachments/BaseAttachments/MarkdownAttachment';
import UrlAttachment from '@statgpt/conversation-view/src/components/Attachments/BaseAttachments/UrlAttachment';
import {
  isCustomChartAttachment,
  isCustomGridAttachment,
  isFileAttachment,
  isGridAttachment,
  isMarkdownAttachment,
  isUrlAttachment,
} from '@statgpt/conversation-view/src/utils/attachments/attachment-parser';
import { Attachment } from '@epam/ai-dial-shared';
import {
  CustomChartAttachmentType,
  CustomGridAttachment,
} from '@statgpt/conversation-view/src/models/attachments';
import { FC, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import AttachmentTabs from './Tabs/AttachmentTabs/AttachmentTabs';
import GridAttachment from '@statgpt/conversation-view/src/components/Attachments/BaseAttachments/GridAttachment';
import { useAdvancedView } from '@statgpt/conversation-view/src/context/AdvancedViewContext';
import AttachmentCollapsed from '@statgpt/conversation-view/src/components/Attachments/AttachmentCollapsed';
import { MessageStyles } from '@statgpt/conversation-view/src/models/message';
import { AttachmentsActions } from '@statgpt/conversation-view/src/models/actions';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import CustomDataGridAttachment from '@statgpt/conversation-view/src/components/Attachments/CustomAttachments/CustomGridAttachment';
import { AttachmentsStyles } from '@statgpt/conversation-view/src/models/attachments-styles';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import CustomChartAttachment from '@statgpt/conversation-view/src/components/Attachments/CustomAttachments/CustomChartAttachment';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { PopUpState } from '@statgpt/ui-components/src/types/pop-up';
import { DownloadType as DownloadTypeOptions } from '@statgpt/sdmx-toolkit/src/types/files';
import { DownloadType } from '@statgpt/download-panel/src/components/DownloadType/DownloadType';
import DownloadSettings from '@statgpt/download-panel/src/components/DownloadSettings/DownloadSettings';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';
import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';
import DatasetTabs from '@statgpt/conversation-view/src/components/Attachments/Tabs/DatasetTabs/DatasetTabs';
import { Alert } from '@statgpt/ui-components/src/components/Alert/Alert';
import { AlertDetails } from '@statgpt/ui-components/src/models/alert';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  attachments: (
    | Attachment
    | CustomGridAttachment
    | CustomChartAttachmentType
  )[];
  actions: AttachmentsActions;
  messageStyles?: MessageStyles;
  isShowAttachments?: boolean;
  showAdvancedView?: boolean;
  attachmentsStyles?: AttachmentsStyles;
  currentDataQuery?: DataQuery;
  dataQueries?: DataQuery[];
  datasets?: Dataflow[];
  isDataLoading?: boolean;
  isDataSetAttachments: boolean;
  locale?: string;
  dimensions?: Dimension[];
  filters?: DatasetQueryFilters;
  titles?: ConversationViewTitles;
  selectDataset?: (datasetUrn?: string) => void;
}

const AttachmentRenderer: FC<Props> = ({
  attachments,
  actions,
  titles,
  messageStyles,
  attachmentsStyles,
  isShowAttachments,
  showAdvancedView,
  currentDataQuery,
  dataQueries,
  datasets,
  isDataLoading,
  isDataSetAttachments,
  locale,
  dimensions,
  filters,
  selectDataset,
}) => {
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] =
    useState<number>(0);
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);

  const { isOpenedAdvancedView, setIsOpenedAdvancedView } = useAdvancedView();
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [downloadType, setDownloadType] = useState<DownloadTypeOptions | null>(
    null,
  );
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [isShowDownloadAlert, setIsShowDownloadAlert] = useState<boolean>();
  const [downloadAlertDetails, setDownloadAlertDetails] =
    useState<AlertDetails>();

  const downloadActions = {
    downloadDataSet: actions.downloadDataSet,
  };

  const selectAttachment = (index: number) => {
    setSelectedAttachmentIndex(index);
  };

  const onOpenAdvancedView = useCallback(() => {
    setIsOpenedAdvancedView(true);
    actions.updateCurrentDataQuery(currentDataQuery);
    actions.updateDataQueries(dataQueries);
    actions.updateDatasets(datasets);
  }, [
    actions,
    currentDataQuery,
    dataQueries,
    datasets,
    setIsOpenedAdvancedView,
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

  const onDownloadTypeSelect = useCallback((key: string) => {
    setDownloadType(key as DownloadTypeOptions);
    setModalState(PopUpState.Opened);
  }, []);

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
            !isOpenedAdvancedView && 'pt-5',
          )}
        >
          {!isOpenedAdvancedView && showLoading ? (
            <Loader />
          ) : (
            <>
              {!isOpenedAdvancedView &&
                datasets?.length != null &&
                datasets?.length > 0 && (
                  <DatasetTabs
                    datasets={datasets}
                    locale={locale}
                    isHideAdvancedViewButton={!showAdvancedView}
                    openAdvancedViewIcon={
                      attachmentsStyles?.openAdvancedViewIcon
                    }
                    selectDataset={selectDataset}
                    onOpenAdvancedView={onOpenAdvancedView}
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
                    />
                    {selectedAttachment &&
                      isCustomGridAttachment(selectedAttachment) && (
                        <DownloadType
                          onDownloadTypeSelect={onDownloadTypeSelect}
                          icon={attachmentsStyles?.downloadIcon}
                          title={attachmentsStyles?.downloadTitle || 'Download'}
                          showChevronIcon={attachmentsStyles?.showChevronIcon}
                          downloadTitles={attachmentsStyles?.downloadTitles}
                        ></DownloadType>
                      )}
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
                        />
                      )}
                      {isCustomGridAttachment(selectedAttachment) && (
                        <CustomDataGridAttachment
                          attachment={selectedAttachment}
                          isDataLoading={isDataLoading}
                          chartColumn={isOpenedAdvancedView}
                          fixHeight={!isOpenedAdvancedView}
                        />
                      )}
                      {isCustomChartAttachment(selectedAttachment) && (
                        <CustomChartAttachment
                          titles={titles}
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
                titles={attachmentsStyles?.downloadTitles}
                setIsShowDownloadAlert={setIsShowDownloadAlert}
                setDownloadAlertDetails={setDownloadAlertDetails}
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
