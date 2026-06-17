/**
 * Message - Individual chat message display component
 *
 * Renders a single chat message with role-based styling, avatar icons,
 * message content formatting, and action buttons. Supports different
 * message types (user, assistant) with appropriate visual indicators
 * and interactive elements.
 */

'use client';

import {
  Attachment,
  FormSchemaButtonOption,
  LikeState,
  Role,
} from '@epam/ai-dial-shared';
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { AttachmentRenderer } from '../../Attachments/AttachmentRenderer';
import MessageContent from '../MessageContent';
import { useAttachmentsData } from '../../../context/AttachmentsData';
import { useDatasets } from '../../../context/Datasets';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { AttachmentsActions } from '../../../models/actions';
import {
  isGridAttachment,
  parseMessageAttachments,
} from '../../../utils/attachments/attachment-parser';
import { getDataQueries } from '../../../utils/attachments/parse-data-query';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { Message as MessageType } from '@epam/statgpt-dial-toolkit';
import { MetadataSettings } from '../../../models/metadata';
import { Loader, useIsMobile } from '@epam/statgpt-ui-components';
import MessageStages from '../MessageStages/MessageStages';
import { AttachmentInfo } from '../../../models/attachments';
import { getAttachmentInfoList } from '../../../utils/attachments-details';
import { AssistantActionsPanel } from '../AssistantActions/AssistantActions';
import { RequestActionsPanel } from '../RequestActions/RequestActions';
import MessageEdit from '../MessageEdit/MessageEdit';
import { ChoiceButtons } from '../../ConversationOnboarding/ChoiceButtons/ChoiceButtons';
import { useAttachmentsDataMultipleQueries } from '../../../context/AttachmentsDataMultipleQueries';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { useCrossDatasetAttachments } from '../../../context/CrossDatasetAttachmentsContext';
import { useDatasetDimensionsMetadataMap } from '../../../context/DatasetDimensionsMetadataMapContext';
import {
  getCrossDatasetSnapshotKey,
  getRestoredActiveDatasetUrns,
} from '../../../utils/multiple-filters';

interface Props {
  message: MessageType;
  previousMessage?: MessageType;
  isStreaming?: boolean;
  isCurrentMessageStreaming?: boolean;
  actions: AttachmentsActions;
  dataQuery?: DataQuery;
  showAdvancedView?: boolean;
  locale: string;
  metadataSettings?: MetadataSettings;
  onAdvancedViewOpen?: () => void;
  regenerateMessage?: (message: MessageType) => void;
  selectMessageToSend: (message?: string, choiceId?: string) => void;
  editMessage?: (message: MessageType) => void;
  rateResponse: (responseId: string, rate: LikeState) => void;
  isReadOnlyConversation?: boolean;
  isLastNotUserMessage?: boolean;
  onCodeAttachmentUpdated?: (messageId: string, attachment: Attachment) => void;
}

const Message: FC<Props> = ({
  message,
  previousMessage,
  actions,
  dataQuery,
  isStreaming = false,
  isCurrentMessageStreaming = false,
  showAdvancedView,
  locale,
  metadataSettings,
  onAdvancedViewOpen,
  regenerateMessage,
  selectMessageToSend,
  rateResponse,
  editMessage,
  isReadOnlyConversation,
  isLastNotUserMessage,
  onCodeAttachmentUpdated,
}) => {
  const {
    messageStyles,
    attachmentsStyles,
    formattingSettings,
    messageActionsIcons,
    editMessageTitles,
    expandStagesIcon,
    titles,
  } = useConversationViewStyles();
  const [attachmentsDataQueries, setAttachmentsDataQueries] = useState<
    DataQuery[] | undefined
  >();
  const [currentAttachmentDataQuery, setCurrentAttachmentDataQuery] = useState<
    DataQuery | undefined
  >();
  const [attachmentInfoList, setAttachmentInfoList] = useState<
    AttachmentInfo[]
  >([]);
  const [baseGridAttachments, setBaseGridAttachments] = useState<Attachment[]>(
    [],
  );
  const [initialSelectedDatasetUrn, setInitialSelectedDatasetUrn] =
    useState<string>();
  const [isDataSetAttachments, setIsDataSetAttachments] =
    useState<boolean>(false);
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const datasetDimensionsMetadata = useDatasetDimensionsMetadataMap();
  const isUser = message.role === Role.User;
  const isSystem = message.role === Role.System;
  const {
    datasets,
    datasetStructuresMap,
    isLoading: isLoadingDatasets,
  } = useDatasets(
    actions.getDataSet,
    actions.updateDatasets,
    actions.updateDataQueries,
    actions.updateCurrentDataQuery,
    attachmentsDataQueries,
    dataQuery,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [choiceButtons, setChoiceButtons] = useState<FormSchemaButtonOption[]>(
    [],
  );

  useEffect(() => {
    setCurrentAttachmentDataQuery(attachmentsDataQueries?.[0]);
  }, [attachmentsDataQueries]);
  const skipSingleDatasetConstraintsLoading =
    isCrossDatasetModeOn && !!attachmentsDataQueries?.length;

  const handleCodeAttachmentUpdated = useCallback(
    (attachment: Attachment) => {
      if (message.id) {
        onCodeAttachmentUpdated?.(message.id, attachment);
      }
    },
    [message.id, onCodeAttachmentUpdated],
  );

  const { dataSetAttachments, dimensions, isLoadingGridData } =
    useAttachmentsData(
      actions,
      locale,
      currentAttachmentDataQuery,
      formattingSettings,
      attachmentsStyles?.chartingStyles,
      metadataSettings,
      titles,
      message.custom_content?.attachments,
      currentAttachmentDataQuery
        ? datasetStructuresMap?.get(currentAttachmentDataQuery.urn)
        : void 0,
      isLoadingDatasets,
      handleCodeAttachmentUpdated,
      skipSingleDatasetConstraintsLoading,
    );

  const restoredActiveDatasetUrns = useMemo(
    () =>
      getRestoredActiveDatasetUrns(
        attachmentsDataQueries,
        datasetDimensionsMetadata.map,
      ),
    [attachmentsDataQueries, datasetDimensionsMetadata.map],
  );

  const {
    crossDatasetAttachments,
    isLoadingGridData: isLoadingCrossDsGridData,
  } = useAttachmentsDataMultipleQueries(
    actions,
    locale,
    attachmentsDataQueries,
    attachmentsStyles?.chartingStyles,
    formattingSettings,
    metadataSettings,
    message.custom_content?.attachments,
    restoredActiveDatasetUrns,
    handleCodeAttachmentUpdated,
    undefined,
    titles,
  );
  const { isOpenedAdvancedView } = useAdvancedView();
  const isMobile = useIsMobile(768);
  const shouldRenderMessageIconColumn = !isMobile;
  const {
    attachments: sharedCrossDatasetAttachments,
    dataQueriesKey: crossDatasetDataQueriesKey,
    isLoading: isCrossDatasetLoading,
  } = useCrossDatasetAttachments();
  const messageCrossDatasetDataQueriesKey = useMemo(
    () => getCrossDatasetSnapshotKey(attachmentsDataQueries),
    [attachmentsDataQueries],
  );
  const shouldUseSharedCrossDatasetAttachments =
    isCrossDatasetModeOn &&
    !!showAdvancedView &&
    sharedCrossDatasetAttachments != null &&
    crossDatasetDataQueriesKey === messageCrossDatasetDataQueriesKey;
  const visibleCrossDatasetAttachments = shouldUseSharedCrossDatasetAttachments
    ? sharedCrossDatasetAttachments
    : crossDatasetAttachments;

  const isDataLoading = useMemo(
    () =>
      isCrossDatasetModeOn
        ? shouldUseSharedCrossDatasetAttachments
          ? isCrossDatasetLoading
          : isLoadingCrossDsGridData
        : isLoadingGridData,
    [
      isCrossDatasetModeOn,
      isLoadingCrossDsGridData,
      isLoadingGridData,
      isCrossDatasetLoading,
      shouldUseSharedCrossDatasetAttachments,
    ],
  );

  const onEditClick = () => {
    if (isUser) {
      setIsEditing(true);
    }
  };

  const onCancel = () => {
    setIsEditing(false);
  };

  const onEditApply = (text: string) => {
    onCancel();
    editMessage?.({ ...message, content: text });
  };

  const onSelectDataset = useCallback(
    (datasetUrn?: string) => {
      if (datasetUrn) {
        setCurrentAttachmentDataQuery(
          attachmentsDataQueries?.find((query) => query?.urn === datasetUrn),
        );
        setInitialSelectedDatasetUrn(void 0);
      }
    },
    [attachmentsDataQueries],
  );

  useEffect(() => {
    const properties = message.custom_content?.form_schema?.properties;
    const choiceButtons = isLastNotUserMessage
      ? properties?.choice?.oneOf || properties?.completion?.oneOf
      : [];
    setChoiceButtons(choiceButtons || []);
  }, [message, isLastNotUserMessage]);

  useEffect(() => {
    const attachments = parseMessageAttachments(message);
    const dataQueries = getDataQueries(attachments);

    const gridAttachments = attachments.filter((attachment) =>
      isGridAttachment(attachment),
    );
    setAttachmentsDataQueries(dataQueries);
    setBaseGridAttachments(gridAttachments);
  }, [message]);

  useEffect(() => {
    setIsDataSetAttachments(
      attachmentsDataQueries != null && attachmentsDataQueries.length > 0,
    );
  }, [attachmentsDataQueries]);

  useEffect(() => {
    if (
      dataQuery?.urn &&
      attachmentsDataQueries?.some((q) => q?.urn === dataQuery.urn)
    ) {
      setInitialSelectedDatasetUrn(dataQuery.urn);
    }
  }, [dataQuery, attachmentsDataQueries]);

  useEffect(() => {
    if (message?.role === Role.System && previousMessage) {
      const previousMessageAttachments =
        parseMessageAttachments(previousMessage);
      const previousMessageDataQueries =
        getDataQueries(previousMessageAttachments) || [];

      if (
        attachmentsDataQueries &&
        previousMessageDataQueries &&
        datasetStructuresMap
      ) {
        setAttachmentInfoList(
          getAttachmentInfoList(
            previousMessageDataQueries,
            attachmentsDataQueries,
            datasetStructuresMap,
            locale,
            datasetDimensionsMetadata.map,
          ),
        );
      }
    }
  }, [
    attachmentsDataQueries,
    currentAttachmentDataQuery,
    datasetStructuresMap,
    datasetDimensionsMetadata.map,
    dimensions,
    locale,
    message?.role,
    previousMessage,
  ]);

  const getMessageIcon = useCallback(
    (variant: 'column' | 'inline' = 'column') => {
      if (
        !isUser &&
        messageStyles?.systemMessageIcon &&
        !(isOpenedAdvancedView && !isCurrentMessageStreaming)
      ) {
        const isInlineIcon = variant === 'inline';

        return (
          <div
            className={classNames(
              'flex-shrink-0 rounded-full flex items-center justify-center',
              isInlineIcon
                ? 'size-[44px] overflow-visible [&_svg]:size-[44px]'
                : 'w-[44px] h-[44px]',
              isCurrentMessageStreaming && !isInlineIcon
                ? 'text-white absolute'
                : 'text-neutrals-400',
            )}
          >
            {messageStyles.systemMessageIcon}
          </div>
        );
      }
      return null;
    },
    [
      isUser,
      messageStyles?.systemMessageIcon,
      isOpenedAdvancedView,
      isCurrentMessageStreaming,
    ],
  );
  const mobileMessageIcon = isMobile ? getMessageIcon('inline') : null;
  const mobileMessageHeaderPrefix =
    isMobile && (mobileMessageIcon != null || isCurrentMessageStreaming) ? (
      <>
        {mobileMessageIcon}
        {isCurrentMessageStreaming && <Loader />}
      </>
    ) : null;
  const hasMessageStages =
    !isUser && !isOpenedAdvancedView && !!message?.custom_content?.stages;
  const shouldRenderMobileIconWithContent =
    isMobile &&
    !hasMessageStages &&
    !isCurrentMessageStreaming &&
    !isEditing &&
    mobileMessageIcon != null;

  const attachmentRendererMemoized = useMemo(
    () => (
      <AttachmentRenderer
        actions={actions}
        attachments={
          isDataSetAttachments
            ? isCrossDatasetModeOn
              ? visibleCrossDatasetAttachments
              : dataSetAttachments
            : baseGridAttachments
        }
        onAdvancedViewOpen={onAdvancedViewOpen}
        isDataSetAttachments={isDataSetAttachments}
        datasets={datasets}
        initialSelectedDatasetUrn={initialSelectedDatasetUrn}
        showAdvancedView={showAdvancedView}
        isSystemAttachments={isSystem}
        isDataLoading={isDataLoading}
        currentDataQuery={currentAttachmentDataQuery}
        dataQueries={attachmentsDataQueries}
        attachmentInfoList={attachmentInfoList}
        locale={locale}
        dimensions={dimensions}
        selectDataset={onSelectDataset}
      />
    ),
    [
      actions,
      isDataSetAttachments,
      dataSetAttachments,
      baseGridAttachments,
      visibleCrossDatasetAttachments,
      datasets,
      initialSelectedDatasetUrn,
      showAdvancedView,
      isSystem,
      isDataLoading,
      currentAttachmentDataQuery,
      attachmentsDataQueries,
      attachmentInfoList,
      locale,
      dimensions,
      onSelectDataset,
      onAdvancedViewOpen,
      isCrossDatasetModeOn,
    ],
  );

  if (isSystem && isOpenedAdvancedView) return null;

  const actionPanel = (() => {
    if (isCurrentMessageStreaming) return null;
    if (isUser)
      return isEditing ? null : (
        <RequestActionsPanel
          messageActionsIcons={messageActionsIcons}
          message={message}
          isStreaming={isStreaming}
          onEditClick={onEditClick}
          isReadOnly={isReadOnlyConversation}
        />
      );
    if (isSystem) return null;
    return (
      <AssistantActionsPanel
        messageActionsIcons={messageActionsIcons}
        message={message}
        isStreaming={isStreaming}
        regenerateMessage={regenerateMessage}
        rateResponse={rateResponse}
        isReadOnly={isReadOnlyConversation}
        isRegenerateAvailable={isLastNotUserMessage}
      />
    );
  })();

  return (
    <div
      className={classNames(
        'max-w-full flex',
        isUser ? 'justify-end' : 'justify-start',
        'message-wrapper',
      )}
    >
      <div
        className={classNames(
          'flex items-start',
          isUser && !isEditing ? 'max-w-full' : 'w-full',
        )}
      >
        {shouldRenderMessageIconColumn && (
          <div className="relative mr-2">
            {getMessageIcon()}
            {isCurrentMessageStreaming && <Loader />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className={classNames(
              isUser ? 'bg-neutrals-300 px-6' : 'pt-0',
              isUser ? 'user-message' : 'system-message',
              isUser && (isEditing ? 'w-[100%] ml-0' : 'ml-12'),
            )}
          >
            {hasMessageStages ? (
              <MessageStages
                stages={message?.custom_content?.stages}
                expandIcon={expandStagesIcon}
                processingTitle={messageStyles?.processingTitle}
                prefixIcon={mobileMessageHeaderPrefix}
              />
            ) : (
              isCurrentMessageStreaming && (
                <>
                  {isMobile ? (
                    <div className="flex items-center gap-2">
                      {mobileMessageHeaderPrefix}
                      <p className="body-1 loading-message text-neutrals-700">
                        {titles?.loading}
                      </p>
                    </div>
                  ) : (
                    <p className="body-1 loading-message text-neutrals-700">
                      {titles?.loading}
                    </p>
                  )}
                </>
              )
            )}

            {isEditing ? (
              <MessageEdit
                content={message.content}
                onCancel={onCancel}
                onEditApply={onEditApply}
                editMessageTitles={editMessageTitles}
              />
            ) : shouldRenderMobileIconWithContent ? (
              <div className="flex items-start gap-2">
                {mobileMessageIcon}
                <div className="min-w-0 flex-1">
                  <MessageContent content={message.content} />
                </div>
              </div>
            ) : (
              <MessageContent content={message.content} />
            )}
          </div>
          {attachmentRendererMemoized}
          {actionPanel}
          {!isOpenedAdvancedView && !isDataLoading && (
            <ChoiceButtons
              choiceButtons={choiceButtons}
              onClick={selectMessageToSend}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
