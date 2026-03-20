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
import classNames from 'classnames';
import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AttachmentRenderer from '../../Attachments/AttachmentRenderer';
import MessageContent from '../MessageContent';
import { useAttachmentsData } from '../../../context/AttachmentsData';
import { useDatasets } from '../../../context/Datasets';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { AttachmentsActions } from '../../../models/actions';
import { AttachmentsStyles } from '../../../models/attachments-styles';
import {
  EditMessageTitles,
  MessageActionIcons,
  MessageStyles,
} from '../../../models/message';
import {
  isGridAttachment,
  parseMessageAttachments,
} from '../../../utils/attachments/attachment-parser';
import { getDataQueries } from '../../../utils/attachments/parse-data-query';
import { DataQuery, FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import { Message as MessageType } from '@epam/statgpt-dial-toolkit';
import { MetadataSettings } from '../../../models/metadata';
import { Loader, LimitMessages } from '@epam/statgpt-ui-components';
import MessageStages from '../MessageStages/MessageStages';
import { ConversationViewTitles } from '../../../models/titles';
import { AttachmentInfo, AttachmentsConfig } from '../../../models/attachments';
import { getAttachmentInfoList } from '../../../utils/attachments-details';
import { AssistantActionsPanel } from '../AssistantActions/AssistantActions';
import { RequestActionsPanel } from '../RequestActions/RequestActions';
import MessageEdit from '../MessageEdit/MessageEdit';
import { ChoiceButtons } from '../../ConversationOnboarding/ChoiceButtons/ChoiceButtons';
import { useAttachmentsDataMultipleQueries } from '../../../context/AttachmentsDataMultipleQueries';
import { useCrossDatasetMode } from '../../../context/CrossDatasetModeContext';

interface Props {
  message: MessageType;
  previousMessage?: MessageType;
  isStreaming?: boolean;
  isCurrentMessageStreaming?: boolean;
  actions: AttachmentsActions;
  dataQuery?: DataQuery;
  messageStyles?: MessageStyles;
  attachmentsStyles?: AttachmentsStyles;
  showAdvancedView?: boolean;
  formattingSettings?: FormatNumbersType;
  locale: string;
  metadataSettings?: MetadataSettings;
  expandStagesIcon?: ReactNode;
  titles?: ConversationViewTitles;
  onAdvancedViewOpen?: () => void;
  regenerateMessage?: (message: MessageType) => void;
  selectMessageToSend: (message?: string, choiceId?: string) => void;
  editMessage?: (message: MessageType) => void;
  messageActionsIcons?: MessageActionIcons;
  rateResponse: (responseId: string, rate: LikeState) => void;
  editMessageTitles: EditMessageTitles;
  isReadOnlyConversation?: boolean;
  isLastNotUserMessage?: boolean;
  limitMessages: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
}

const Message: FC<Props> = ({
  message,
  previousMessage,
  titles,
  actions,
  dataQuery,
  isStreaming = false,
  isCurrentMessageStreaming = false,
  messageStyles,
  attachmentsStyles,
  showAdvancedView,
  formattingSettings,
  locale,
  metadataSettings,
  expandStagesIcon,
  onAdvancedViewOpen,
  regenerateMessage,
  selectMessageToSend,
  messageActionsIcons,
  rateResponse,
  editMessage,
  editMessageTitles,
  isReadOnlyConversation,
  isLastNotUserMessage,
  limitMessages,
  attachmentsConfig,
}) => {
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
  const { isCrossDatasetModeOn } = useCrossDatasetMode();
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
  );
  const [isEditing, setIsEditing] = useState(false);
  const [choiceButtons, setChoiceButtons] = useState<FormSchemaButtonOption[]>(
    [],
  );

  useEffect(() => {
    setCurrentAttachmentDataQuery(attachmentsDataQueries?.[0]);
  }, [attachmentsDataQueries]);

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
    );

  const {
    crossDatasetGridAttachment,
    isLoadingGridData: isLoadingCrossDsGridData,
  } = useAttachmentsDataMultipleQueries(
    actions,
    locale,
    attachmentsDataQueries,
    attachmentsStyles?.chartingStyles,
    formattingSettings,
    metadataSettings,
  );
  const { isOpenedAdvancedView } = useAdvancedView();

  const isDataLoading = useMemo(
    () => (isCrossDatasetModeOn ? isLoadingCrossDsGridData : isLoadingGridData),
    [isCrossDatasetModeOn, isLoadingCrossDsGridData, isLoadingGridData],
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
    if (dataQuery && dataQuery.urn) {
      setInitialSelectedDatasetUrn(dataQuery.urn);
    }
  }, [dataQuery]);

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
          ),
        );
      }
    }
  }, [
    attachmentsDataQueries,
    currentAttachmentDataQuery,
    datasetStructuresMap,
    dimensions,
    locale,
    message?.role,
    previousMessage,
  ]);

  const getMessageIcon = useCallback(() => {
    if (
      !isUser &&
      messageStyles?.systemMessageIcon &&
      !(isOpenedAdvancedView && !isCurrentMessageStreaming)
    ) {
      return (
        <div
          className={classNames(
            'flex-shrink-0 rounded-full flex items-center justify-center w-[44px] h-[44px]',
            isCurrentMessageStreaming
              ? 'text-white absolute'
              : 'text-neutrals-400',
          )}
        >
          {messageStyles.systemMessageIcon}
        </div>
      );
    }
    return null;
  }, [
    isUser,
    messageStyles?.systemMessageIcon,
    isOpenedAdvancedView,
    isCurrentMessageStreaming,
  ]);

  const attachmentRendererMemoized = useMemo(
    () => (
      <AttachmentRenderer
        actions={actions}
        titles={titles}
        attachments={
          isDataSetAttachments
            ? isCrossDatasetModeOn
              ? [crossDatasetGridAttachment]
              : dataSetAttachments
            : baseGridAttachments
        }
        onAdvancedViewOpen={onAdvancedViewOpen}
        isDataSetAttachments={isDataSetAttachments}
        datasets={datasets}
        initialSelectedDatasetUrn={initialSelectedDatasetUrn}
        messageStyles={messageStyles}
        attachmentsStyles={attachmentsStyles}
        showAdvancedView={showAdvancedView}
        isSystemAttachments={isSystem}
        isDataLoading={isDataLoading}
        currentDataQuery={currentAttachmentDataQuery}
        dataQueries={attachmentsDataQueries}
        attachmentInfoList={attachmentInfoList}
        locale={locale}
        dimensions={dimensions}
        selectDataset={onSelectDataset}
        limitMessages={limitMessages}
        attachmentsConfig={attachmentsConfig}
      />
    ),
    [
      actions,
      titles,
      isDataSetAttachments,
      dataSetAttachments,
      baseGridAttachments,
      crossDatasetGridAttachment,
      datasets,
      initialSelectedDatasetUrn,
      messageStyles,
      attachmentsStyles,
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
      limitMessages,
      attachmentsConfig,
    ],
  );

  return (
    <>
      {!(isSystem && isOpenedAdvancedView) && (
        <div
          className={classNames(
            'max-w-full flex',
            isUser ? 'justify-end' : 'justify-start',
            'message-wrapper',
          )}
        >
          <div
            className={classNames(
              'flex items-start max-w-full',
              (isSystem || isEditing) && 'w-full',
            )}
          >
            <div className="mr-2 relative">
              {getMessageIcon()}
              {isCurrentMessageStreaming && <Loader />}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={classNames(
                  isUser ? 'bg-neutrals-300 px-6' : 'pt-0',
                  isUser ? 'user-message' : 'system-message',
                  isUser && (isEditing ? 'w-[100%] ml-0' : 'ml-12'),
                )}
              >
                {!isUser &&
                !isOpenedAdvancedView &&
                message?.custom_content?.stages ? (
                  <MessageStages
                    stages={message?.custom_content?.stages}
                    expandIcon={expandStagesIcon}
                    processingTitle={messageStyles?.processingTitle}
                  />
                ) : (
                  isCurrentMessageStreaming && (
                    <p className="body-1 text-neutrals-700 loading-message">
                      {titles?.loading}
                    </p>
                  )
                )}

                {isEditing ? (
                  <MessageEdit
                    content={message.content}
                    onCancel={onCancel}
                    onEditApply={onEditApply}
                    editMessageTitles={editMessageTitles}
                  />
                ) : (
                  <MessageContent content={message.content} />
                )}
              </div>
              {attachmentRendererMemoized}
              {!isCurrentMessageStreaming &&
                (isUser ? (
                  !isEditing && (
                    <RequestActionsPanel
                      messageActionsIcons={messageActionsIcons}
                      message={message}
                      isStreaming={isStreaming}
                      onEditClick={onEditClick}
                      isReadOnly={isReadOnlyConversation}
                    />
                  )
                ) : (
                  <AssistantActionsPanel
                    messageActionsIcons={messageActionsIcons}
                    message={message}
                    isStreaming={isStreaming}
                    regenerateMessage={regenerateMessage}
                    rateResponse={rateResponse}
                    isReadOnly={isReadOnlyConversation}
                    isRegenerateAvailable={isLastNotUserMessage}
                  />
                ))}
              {!isOpenedAdvancedView && !isDataLoading && (
                <ChoiceButtons
                  choiceButtons={choiceButtons}
                  onClick={selectMessageToSend}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Message;
