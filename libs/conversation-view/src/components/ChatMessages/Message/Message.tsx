/**
 * Message - Individual chat message display component
 *
 * Renders a single chat message with role-based styling, avatar icons,
 * message content formatting, and action buttons. Supports different
 * message types (user, assistant) with appropriate visual indicators
 * and interactive elements.
 */

'use client';

import { Attachment, Role } from '@epam/ai-dial-shared';
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
import { MessageStyles } from '../../../models/message';
import {
  isGridAttachment,
  parseMessageAttachments,
} from '../../../utils/attachments/attachment-parser';
import { getDataQueries } from '../../../utils/attachments/parse-data-query';
import {
  DataQuery,
  QueryFilterDetails,
} from '@statgpt/shared-toolkit/src/models/data-query';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';
import { Message as MessageType } from '@statgpt/dial-toolkit/src/models/message';
import { MetadataSettings } from '../../../models/metadata';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';
import MessageStages from '../MessageStages/MessageStages';
import { ConversationViewTitles } from '../../../models/titles';
import {
  getQueryFiltersDetails,
  getUpdatedQueryFiltersDetails,
} from '../../../utils/query-filters-details';

interface Props {
  message: MessageType;
  previousMessage?: MessageType;
  isStreaming?: boolean;
  actions: AttachmentsActions;
  messageStyles?: MessageStyles;
  attachmentsStyles?: AttachmentsStyles;
  showAdvancedView?: boolean;
  formattingSettings?: FormatNumbersType;
  locale: string;
  metadataSettings?: MetadataSettings;
  expandStagesIcon?: ReactNode;
  titles?: ConversationViewTitles;
  onAdvancedViewOpen?: () => void;
}

const Message: FC<Props> = ({
  message,
  previousMessage,
  titles,
  actions,
  isStreaming = false,
  messageStyles,
  attachmentsStyles,
  showAdvancedView,
  formattingSettings,
  locale,
  metadataSettings,
  expandStagesIcon,
  onAdvancedViewOpen,
}) => {
  const [attachmentsDataQueries, setAttachmentsDataQueries] = useState<
    DataQuery[] | undefined
  >();
  const [currentAttachmentDataQuery, setCurrentAttachmentDataQuery] = useState<
    DataQuery | undefined
  >(attachmentsDataQueries?.[0]);
  const [queryFiltersDetails, setQueryFiltersDetails] = useState<
    QueryFilterDetails[]
  >([]);
  const [baseGridAttachments, setBaseGridAttachments] = useState<Attachment[]>(
    [],
  );
  const [isDataSetAttachments, setIsDataSetAttachments] =
    useState<boolean>(false);
  const isUser = message.role === Role.User;
  const isSystem = message.role === Role.System;
  const { datasets } = useDatasets(actions?.getDataSet, attachmentsDataQueries);
  const { dataSetAttachments, dimensions, isLoadingGridData, structures } =
    useAttachmentsData(
      actions,
      locale,
      currentAttachmentDataQuery,
      formattingSettings,
      attachmentsStyles?.chartingStyles,
      metadataSettings,
      titles,
    );
  const { isOpenedAdvancedView } = useAdvancedView();

  const onSelectDataset = useCallback(
    (datasetUrn?: string) => {
      if (datasetUrn) {
        setCurrentAttachmentDataQuery(
          attachmentsDataQueries?.find((query) => query?.urn === datasetUrn),
        );
      }
    },
    [attachmentsDataQueries],
  );

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
    if (message?.role === Role.System && previousMessage) {
      const previousMessageAttachments =
        parseMessageAttachments(previousMessage);
      const previousMessageDataQuery = getDataQueries(
        previousMessageAttachments,
      )?.find(
        (previousQuery) =>
          previousQuery?.urn === currentAttachmentDataQuery?.urn,
      );

      if (
        currentAttachmentDataQuery &&
        previousMessageDataQuery &&
        structures
      ) {
        setQueryFiltersDetails(
          getUpdatedQueryFiltersDetails(
            getQueryFiltersDetails(
              previousMessageDataQuery?.filters,
              dimensions,
              structures?.conceptSchemes || [],
              structures?.codelists || [],
              locale,
            ),
            getQueryFiltersDetails(
              currentAttachmentDataQuery?.filters,
              dimensions,
              structures?.conceptSchemes || [],
              structures?.codelists || [],
              locale,
            ),
          ),
        );
      }
    }
  }, [
    currentAttachmentDataQuery,
    dimensions,
    locale,
    message?.role,
    previousMessage,
    structures,
  ]);

  const getMessageIcon = useCallback(() => {
    if (
      !isUser &&
      messageStyles?.systemMessageIcon &&
      !(isOpenedAdvancedView && !isStreaming)
    ) {
      return (
        <div
          className={classNames(
            'flex-shrink-0 rounded-full flex items-center justify-center w-[44px] h-[44px]',
            isStreaming ? 'text-white absolute' : 'text-neutrals-400',
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
    isStreaming,
  ]);

  const attachmentRendererMemoized = useMemo(
    () => (
      <AttachmentRenderer
        actions={actions}
        titles={titles}
        attachments={
          isDataSetAttachments ? dataSetAttachments : baseGridAttachments
        }
        onAdvancedViewOpen={onAdvancedViewOpen}
        isDataSetAttachments={isDataSetAttachments}
        datasets={datasets}
        messageStyles={messageStyles}
        attachmentsStyles={attachmentsStyles}
        showAdvancedView={showAdvancedView}
        isSystemAttachments={isSystem}
        isDataLoading={isLoadingGridData}
        currentDataQuery={currentAttachmentDataQuery}
        dataQueries={attachmentsDataQueries}
        queryFiltersDetails={queryFiltersDetails}
        locale={locale}
        dimensions={dimensions}
        selectDataset={onSelectDataset}
      />
    ),
    [
      actions,
      titles,
      isDataSetAttachments,
      dataSetAttachments,
      baseGridAttachments,
      datasets,
      messageStyles,
      attachmentsStyles,
      showAdvancedView,
      isSystem,
      isLoadingGridData,
      currentAttachmentDataQuery,
      attachmentsDataQueries,
      queryFiltersDetails,
      locale,
      dimensions,
      onSelectDataset,
      onAdvancedViewOpen,
    ],
  );

  return (
    <div
      className={classNames(
        'max-w-full flex',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={classNames(
          'flex items-start max-w-full',
          isSystem && 'w-full',
        )}
      >
        <div className="mr-2 relative">
          {getMessageIcon()}
          {isStreaming && <Loader />}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={classNames(
              isUser ? 'bg-neutrals-300 px-6 ml-12' : 'pt-0',
              isUser ? 'user-message' : 'system-message',
            )}
          >
            {!isUser &&
              !isOpenedAdvancedView &&
              message?.custom_content?.stages && (
                <MessageStages
                  stages={message?.custom_content?.stages}
                  expandIcon={expandStagesIcon}
                  processingTitle={messageStyles?.processingTitle}
                />
              )}
            <MessageContent content={message.content} />
          </div>
          {!(isSystem && isOpenedAdvancedView) && attachmentRendererMemoized}
        </div>
      </div>
    </div>
  );
};

export default Message;
