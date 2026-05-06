'use client';

import {
  AdvancedView,
  ConversationView,
  DatasetInfoOptions,
  useAdvancedView,
  useConversationViewFeatureToggles,
  AttachmentsActions,
  AttachmentsStyles,
  ChartingIcon,
  ConversationViewTitles,
  MessageActionIcons,
} from '@epam/statgpt-conversation-view';
import { openDownloadWindow, Dataflow } from '@epam/statgpt-sdmx-toolkit';
import {
  CUSTOM_PERIOD,
  DataQuery,
  HTTP_ERROR_CODES,
  HttpError,
  TimeRangeOptions,
  ApiResponse,
} from '@epam/statgpt-shared-toolkit';
import { useConversationList } from '../../context/ConversationListContext';
import MessageIcon from '../../../public/images/chat/message-icon.svg';
import Footer from '../Footer/Footer';
import { formatNumbers } from '../../constants/format-numbers';
import { SHARE_CONVERSATION_PROPS } from '../../constants/share-conversation';
import { ApplicationRoute } from '../../types/application-routes';
import Dataset from '../../../public/images/chat/data-set.svg';
import { TranslateI18nFn, useI18n } from '../../locales/client';
import {
  AdvancedViewI18nKeys,
  AppI18nKeys,
  AttachmentsI18nKeys,
  AuthI18nKeys,
  ChatI18nKeys,
  ConversationI18nKeys,
  DownloadI18nKeys,
  MessageI18nKeys,
  NavI18nKeys,
  TimeI18nKeys,
  WelcomeI18nKeys,
} from '../../constants/i18n-keys';
import {
  getFileApi,
  getFileBlobApi,
  putFileApi,
} from '../../app/api/files/client';
import { getConstraintsApi } from '../../app/api/constraints/client';
import {
  getConversationApi,
  updateConversationApi,
  createConversationApi,
  getConversationsApi,
} from '../../app/api/conversations/client';
import { getBucketApi } from '../../app/api/bucket/client';
import { getDataSetApi, getDataSetDataApi } from '../../app/api/dataset/client';
import { getPythonAttachmentApi } from '../../app/api/python-attachment/client';
import { getAvailableHierarchiesApi } from '../../app/api/codelist/client';
import { getHierarchyApi } from '../../app/api/hierarchy/client';
import { rateResponseApi } from '../../app/api/rate/client';
import AdvancedModeIcon from '../../../public/images/advanced-mode.svg';
import InfoIcon from '../../../public/images/statuses/info.svg';
import WarningIcon from '../../../public/images/statuses/warning.svg';
import UnfoldIcon from '../../../public/images/unfold.svg';
import DownloadIcon from '../../../public/images/chat/download.svg';
import SuccessIcon from '../../../public/images/chat/success.svg';
import ErrorIcon from '../../../public/images/chat/error.svg';
import ChevronRight from '../../../public/images/chevron-right.svg';
import ChevronLeft from '../../../public/images/chevron-left.svg';
import ChevronSolidDownIcon from '../../../public/images/chevron-solid-down.svg';
import Regenerate from '../../../public/images/messages/renew.svg';
import Copy from '../../../public/images/messages/copy.svg';
import CheckIcon from '../../../public/images/check.svg';
import ThumbUp from '../../../public/images/messages/thumb-up.svg';
import ThumbDown from '../../../public/images/messages/thumb-down.svg';
import Edit from '../../../public/images/messages/edit.svg';
import Down from '../../../public/images/chat/down.svg';
import ThumbPressed from '../../../public/images/messages/thumb-filled.svg';
import Reset from '../../../public/images/reset.svg';
import ExternalLink from '../../../public/images/external-link.svg';
import GearIcon from '../../../public/images/gear.svg';
import ResetArrowIcon from '../../../public/images/reset-arrow.svg';
import {
  IconCalendarWeek,
  IconChevronRight,
  IconCircleFilled,
  IconSend,
  IconSquareCheckFilled,
} from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JWT } from 'next-auth/jwt';
import { Conversation } from '@epam/ai-dial-shared';
import { signOut } from 'next-auth/react';
import { getSignInLink } from '../../constants/auth';
import { wrapWithAuthHandler } from '../../utils/auth/requests-wrapper';
import { Alert, AlertType, LimitMessages } from '@epam/statgpt-ui-components';
import WelcomeView from '../WelcomeView/WelcomeView';

interface Props {
  bucketId: string;
  conversationId: string;
  token: JWT | null;
}

const ConversationViewWrapper: FC<Props> = ({
  bucketId,
  conversationId,
  token,
}) => {
  const router = useRouter();
  const { isOpenedAdvancedView } = useAdvancedView();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const { setConversations } = useConversationList();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [currentDataQuery, setCurrentDataQuery] = useState<
    DataQuery | undefined
  >();
  const [dataQueries, setDataQueries] = useState<DataQuery[]>();
  const [datasets, setDatasets] = useState<Dataflow[]>();
  const [isConversationNotFound, setIsConversationNotFound] = useState(false);
  const [showNotFoundAlert, setShowNotFoundAlert] = useState(false);
  const { locale, id }: { locale: string; id: string[] } = useParams();
  const chartingIcons = {
    [ChartingIcon.NEXT]: <ChevronRight width={20} height={20} />,
    [ChartingIcon.PREVIOUS]: <ChevronLeft width={20} height={20} />,
  };

  const t = useI18n() as TranslateI18nFn;

  const conversationKey = useMemo(
    () => `${bucketId}/${locale}/${conversationId}`,
    [locale, bucketId, conversationId],
  );

  useEffect(() => {
    setIsConversationNotFound(false);
    setShowNotFoundAlert(false);
  }, [conversationKey]);

  const handleConversationNotFound = useCallback(() => {
    setIsConversationNotFound(true);
    setShowNotFoundAlert(true);
  }, []);

  const openUrl = useCallback((url: string) => router.push(url), [router]);

  const authHandler = useCallback(
    function <Args extends any[], T>(
      action: (...args: Args) => Promise<ApiResponse<T>>,
    ): (...args: Args) => Promise<T> {
      return wrapWithAuthHandler(action, () => {
        openUrl(getSignInLink(window.location.href));
      });
    },
    [openUrl],
  );

  const shareConversationApiProps = useMemo(
    () => SHARE_CONVERSATION_PROPS(authHandler),
    [authHandler],
  );

  const shareConversationProps = useMemo(
    () => ({
      ...shareConversationApiProps,
      id,
      share: t(ChatI18nKeys.SHARE),
      shareLink: t(ChatI18nKeys.SHARE_LINK_TITLE),
      close: t(AppI18nKeys.CLOSE),
      shareCopyLink: t(ChatI18nKeys.SHARE_COPY_LINK),
      shareCopiedLink: t(ChatI18nKeys.SHARE_COPIED_LINK),
      shareDescription: t(ChatI18nKeys.SHARE_LINK_DESCRIPTION),
      shareRemoveAccessToUsers: t(ChatI18nKeys.SHARE_REMOVE_ACCESS_TO_USERS),
      chatExpiration: t(ChatI18nKeys.CHAT_EXPIRATION),
      chatExpirationDays: t(ChatI18nKeys.CHAT_EXPIRATION_DAYS),
      chatName: t(ChatI18nKeys.CHAT_NAME),
      chatWarning: t(ChatI18nKeys.CHAT_WARNING),
    }),
    [id, shareConversationApiProps, t],
  );
  const conversationViewTitles: ConversationViewTitles = {
    newChat: t(NavI18nKeys.NEW_CHAT),
    welcomeTitle: t(WelcomeI18nKeys.TITLE),
    askAnything: t(WelcomeI18nKeys.ASK_ANYTHING),
    duplicate: t(ChatI18nKeys.DUPLICATE_CHAT),
    close: t(AppI18nKeys.CLOSE),
    chart: t(AttachmentsI18nKeys.CHART),
    codeSamples: t(AttachmentsI18nKeys.CODE_SAMPLES),
    noMetadata: t(AdvancedViewI18nKeys.NO_METADATA),
    explore: t(ChatI18nKeys.EXPLORE_DATA),
    apply: t(AdvancedViewI18nKeys.APPLY),
    cancel: t(AppI18nKeys.CANCEL),
    from: t(AdvancedViewI18nKeys.FROM),
    to: t(AdvancedViewI18nKeys.TO),
    all: t(AdvancedViewI18nKeys.ALL),
    displayOrder: t(AdvancedViewI18nKeys.DISPLAY_ORDER),
    hierarchy: t(AdvancedViewI18nKeys.HIERARCHY),
    flatList: t(AdvancedViewI18nKeys.FLAT_LIST),
    reset: t(AdvancedViewI18nKeys.RESET_SELECTED_VALUES),
    chartInfo: t(AttachmentsI18nKeys.CHART_INFO),
    chartNoData: t(AdvancedViewI18nKeys.CHART_NO_DATA),
    limitLinkInfoLink: t(AttachmentsI18nKeys.LIMITS_INFO_LINK),
    limitLinkInfoP1_1: t(AttachmentsI18nKeys.LIMITS_INFO_P1_1),
    limitLinkInfoP1_2: t(AttachmentsI18nKeys.LIMITS_INFO_P1_2),
    limitLinkInfoP1_3: t(AttachmentsI18nKeys.LIMITS_INFO_P1_3),
    limitLinkInfoP2_1: t(AttachmentsI18nKeys.LIMITS_INFO_P2_1),
    limitLinkInfoP2_2: t(AttachmentsI18nKeys.LIMITS_INFO_P2_2),
    limitLinkInfoP2_3: t(AttachmentsI18nKeys.LIMITS_INFO_P2_3),
    limitLinkInfoP2_4: t(AttachmentsI18nKeys.LIMITS_INFO_P2_4),
    limitLinkInfoP2_5: t(AttachmentsI18nKeys.LIMITS_INFO_P2_5),
    limits: t(AttachmentsI18nKeys.LIMITS),
    timeseriesLimit: t(AttachmentsI18nKeys.TIME_SERIES_LIMIT),
    searchPlaceholder: t(AppI18nKeys.SEARCH),
    clearAll: t(AdvancedViewI18nKeys.CLEAR_ALL),
    clearAllFilters: t(AdvancedViewI18nKeys.CLEAR_ALL_FILTERS),
    appliedFilters: t(AdvancedViewI18nKeys.APPLIED_FILTERS),
    otherResults: t(AdvancedViewI18nKeys.OTHER_RESULTS),
    searchMinCharsCaption: t(AdvancedViewI18nKeys.SEARCH_MIN_CHARS_CAPTION),
    noResultsInSection: (sectionName) =>
      t(AdvancedViewI18nKeys.NO_RESULTS_IN_SECTION, { sectionName }),
    noResultsInOtherDimensions: t(
      AdvancedViewI18nKeys.NO_RESULTS_IN_OTHER_DIMENSIONS,
    ),
    settings: t(AdvancedViewI18nKeys.SETTINGS),
    content: t(AdvancedViewI18nKeys.CONTENT),
    advanceViewTitle: t(AdvancedViewI18nKeys.TITLE),
    metadata: t(AdvancedViewI18nKeys.METADATA),
    timeSeries: t(AdvancedViewI18nKeys.TIMESERIES),
    observation: t(AdvancedViewI18nKeys.OBSERVATION),
    dataset: t(AdvancedViewI18nKeys.DATASET),
    agency: t(AdvancedViewI18nKeys.AGENCY),
    lastUpdated: t(AdvancedViewI18nKeys.LAST_UPDATED),
    quarterly: t(TimeI18nKeys.QUARTERLY),
    monthly: t(TimeI18nKeys.MONTHLY),
    dataGrid: t(AttachmentsI18nKeys.DATA_GRID),
    countryDimensions: t(AttachmentsI18nKeys.COUNTRY_DIMENSIONS),
    indicatorDimensions: t(AttachmentsI18nKeys.INDICATOR_DIMENSIONS),
    frequency: t(AttachmentsI18nKeys.FREQUENCY),
    timeseriesMetadataPanel: t(AttachmentsI18nKeys.TIMESERIES_METADATA_PANEL),
    datasetMetadataPanel: t(AttachmentsI18nKeys.DATASET_METADATA_PANEL),
    countryMetadataPanel: t(AttachmentsI18nKeys.COUNTRY_METADATA_PANEL),
    indicatorMetadataPanel: t(AttachmentsI18nKeys.INDICATOR_METADATA_PANEL),
    queryUpdatedManually: t(MessageI18nKeys.QUERY_UPDATED_MANUALLY),
    setTo: t(MessageI18nKeys.SET_TO),
    signOut: t(AuthI18nKeys.SIGN_OUT),
    loading: t(MessageI18nKeys.LOADING),
  };
  const attachmentsActions = useMemo(
    () =>
      ({
        getFile: authHandler(getFileApi),
        getDataSet: authHandler(getDataSetApi),
        getDataSetData: authHandler(getDataSetDataApi),
        downloadDataSet: openDownloadWindow,
        getConstraints: authHandler(getConstraintsApi),
        getPythonAttachment: authHandler(getPythonAttachmentApi),
        updateCurrentDataQuery: (dataQuery?: DataQuery) => {
          setCurrentDataQuery(dataQuery);
        },
        updateDataQueries: (dataQueries?: DataQuery[]) => {
          setDataQueries(dataQueries);
        },
        updateDatasets: (datasets?: Dataflow[]) => {
          setDatasets(datasets);
        },
      }) as AttachmentsActions,
    [authHandler],
  );
  const conversationViewActions = useMemo(
    () => ({
      getConversation: authHandler(getConversationApi),
      getConversations: authHandler(getConversationsApi),
      updateConversation: authHandler(updateConversationApi),
      getBucket: authHandler(getBucketApi),
      getFileBlob: authHandler(getFileBlobApi),
      createConversation: authHandler(createConversationApi),
      putFile: authHandler(putFileApi),
      rateResponse: authHandler(rateResponseApi),
      ...attachmentsActions,
    }),
    [attachmentsActions, authHandler],
  );

  const timeRangeOptions: TimeRangeOptions[] = [
    { value: 0, title: t(AdvancedViewI18nKeys.ALL_PERIODS) },
    { value: -5, title: t(AdvancedViewI18nKeys.YEARS, { years: 5 }) },
    { value: -10, title: t(AdvancedViewI18nKeys.YEARS, { years: 10 }) },
    { value: -20, title: t(AdvancedViewI18nKeys.YEARS, { years: 20 }) },
    { value: CUSTOM_PERIOD, title: t(AdvancedViewI18nKeys.CUSTOM_PERIOD) },
  ];

  const attachmentsStyles: AttachmentsStyles = {
    showTabIcon: true,
    downloadCollapsible: false,
    downloadIcon: <DownloadIcon className="size-5" />,
    downloadButtonTextClassName: 'h4',
    hideDownloadTextInConversationView: true,
    hideDownloadIconInAdvancedView: true,
    downloadChevronIcon: <ChevronSolidDownIcon className="size-6" />,
    infoDownloadIcon: <InfoIcon className="size-6 text-primary" />,
    successDownloadIcon: (
      <SuccessIcon className="size-6 text-semantic-success" />
    ),
    downloadInProgressActionIcon: <Reset className="size-4" />,
    downloadErrorActionIcon: <ExternalLink className="size-4" />,
    closeTitle: t(AppI18nKeys.CLOSE),
    downloadTitle: t(DownloadI18nKeys.DOWNLOAD),
    tableSettings: t(AttachmentsI18nKeys.TABLE_SETTINGS),
    tableSettingsIcon: <GearIcon className="size-4" />,
    tableSettingsResetIcon: <ResetArrowIcon className="size-4" />,
    columnsDisplayTitle: t(AttachmentsI18nKeys.COLUMNS_DISPLAY),
    columnsSearchPlaceholder: t(AttachmentsI18nKeys.COLUMNS_SEARCH_PLACEHOLDER),
    compactViewTitle: t(AttachmentsI18nKeys.COMPACT_VIEW_TITLE),
    compactViewDescription: t(AttachmentsI18nKeys.COMPACT_VIEW_DESCRIPTION, {
      bold: (
        <strong>{t(AttachmentsI18nKeys.COMPACT_VIEW_DESCRIPTION_BOLD)}</strong>
      ),
    }),
    extendedViewTitle: t(AttachmentsI18nKeys.EXTENDED_VIEW_TITLE),
    extendedViewDescription: t(AttachmentsI18nKeys.EXTENDED_VIEW_DESCRIPTION, {
      bold: (
        <strong>{t(AttachmentsI18nKeys.EXTENDED_VIEW_DESCRIPTION_BOLD)}</strong>
      ),
    }),
    openLinkTitle: t(AttachmentsI18nKeys.OPEN_URL),
    dataGridTitle: t(AttachmentsI18nKeys.DATA_GRID),
    errorDownloadIcon: <ErrorIcon className="size-6 text-semantic-error" />,
    datasetIcon: <Dataset className="size-5" />,
    chartingIcons,
    copyTitle: t(ChatI18nKeys.COPY),
    copiedTitle: t(ChatI18nKeys.SHARE_COPIED_LINK),
    copyIcon: <Copy className="size-4" />,
    copiedIcon: <CheckIcon className="size-4" />,
    downloadTitles: {
      partialDataset: t(DownloadI18nKeys.PARTIAL_DATASET),
      fullDataset: t(DownloadI18nKeys.FULL_DATASET),
      download: t(DownloadI18nKeys.DOWNLOAD),
      includeMetadata: t(DownloadI18nKeys.INCLUDE_METADATA),
      metadata: t(DownloadI18nKeys.METADATA),
      all: t(DownloadI18nKeys.ALL),
      none: t(DownloadI18nKeys.NONE),
      attributes: t(DownloadI18nKeys.ATTRIBUTES),
      dataFormat: t(DownloadI18nKeys.DATA_FORMAT),
      downloadType: t(DownloadI18nKeys.DOWNLOAD_TYPE),
      dataset: t(DownloadI18nKeys.DATASET),
      idOptions: t(DownloadI18nKeys.ID),
      idOptionsDescription: t(DownloadI18nKeys.ID_DESCRIPTION),
      idAndNameOptions: t(DownloadI18nKeys.ID_NAME),
      idAndNameOptionsDescription: t(DownloadI18nKeys.ID_NAME_DESCRIPTION),
      nameOptions: t(DownloadI18nKeys.NAME),
      nameOptionsDescription: t(DownloadI18nKeys.NAME_DESCRIPTION),
      close: t(AppI18nKeys.CLOSE),
      cancel: t(DownloadI18nKeys.CANCEL),
      filesWillBeDownloaded: (count: number) =>
        t(DownloadI18nKeys.FILES_WILL_BE_DOWNLOADED, { count }),
      oneFilePerDataset: t(DownloadI18nKeys.ONE_FILE_PER_DATASET),
      datasetsToDownload: t(DownloadI18nKeys.DATASETS_TO_DOWNLOAD),
      rows: t(DownloadI18nKeys.ROWS),
      downloadStartedTitle: t(DownloadI18nKeys.DOWNLOAD_STARTED_TITLE),
      downloadStartedText: (dataFormat: string) =>
        t(DownloadI18nKeys.DOWNLOAD_STARTED_TEXT, { dataFormat }),
      downloadInProgressTitle: (current: number, total: number) =>
        t(DownloadI18nKeys.DOWNLOAD_IN_PROGRESS_TITLE, {
          current,
          total,
        }),
      downloadInProgressText: (datasetName: string, dataFormat: string) =>
        t(DownloadI18nKeys.DOWNLOAD_IN_PROGRESS_TEXT, {
          dataFormat,
          datasetName,
        }),
      downloadSuccessTitle: (dataFormat: string) =>
        t(DownloadI18nKeys.DOWNLOAD_SUCCESS_TITLE, { dataFormat }),
      downloadSuccessMultipleTitle: (count: number) =>
        t(DownloadI18nKeys.DOWNLOAD_SUCCESS_MULTIPLE_TITLE, { count }),
      downloadSuccessText: (fileName: string, rows: number) =>
        t(DownloadI18nKeys.DOWNLOAD_SUCCESS_TEXT, { fileName, rows }),
      downloadSuccessMultipleText: (count: number) =>
        t(DownloadI18nKeys.DOWNLOAD_SUCCESS_MULTIPLE_TEXT, { count }),
      downloadFailedTitle: t(DownloadI18nKeys.DOWNLOAD_FAILED_TITLE),
      downloadFailedText: (datasetName: string) =>
        t(DownloadI18nKeys.DOWNLOAD_FAILED_TEXT, { datasetName }),
      downloadFailedMultipleText: (count: number) =>
        t(DownloadI18nKeys.DOWNLOAD_FAILED_MULTIPLE_TEXT, { count }),
      downloadCancelActionText: t(DownloadI18nKeys.DOWNLOAD_CANCEL_ACTION_TEXT),
      downloadRetryActionText: t(DownloadI18nKeys.DOWNLOAD_RETRY_ACTION_TEXT),
    },
  };

  const messageActionsIcons: MessageActionIcons = {
    regenerate: <Regenerate width={20} height={20} />,
    copy: <Copy width={20} height={20} />,
    thumbUp: <ThumbUp width={20} height={20} />,
    thumbDown: <ThumbDown width={20} height={20} />,
    edit: <Edit width={20} height={20} />,
    thumbPressed: <ThumbPressed width={20} height={20} />,
  };

  const limitMessages: LimitMessages = {
    warningIcon: <WarningIcon className="size-4 text-semantic-warning" />,
    largeQuery: t(AdvancedViewI18nKeys.LARGE_QUERY),
    showingLimit: (limit: number) =>
      t(AdvancedViewI18nKeys.SHOWING_LIMIT, { limit }),
    downloadMessage: (limit: number) =>
      t(AdvancedViewI18nKeys.DOWNLOAD_MESSAGE, { limit }),
    refineInAdvancedView: t(AdvancedViewI18nKeys.REFINE_IN_ADVANCED_VIEW),
    editIcon: <Edit className="size-4" />,
    externalLink: currentDataQuery?.metadata?.datasetUrl,
    dataExplorer: t(AdvancedViewI18nKeys.DATA_EXPLORER),
    fullLimitMessage: t(AdvancedViewI18nKeys.FULL_LIMIT_MESSAGE),
    excelFormatTitle: t(AdvancedViewI18nKeys.EXCEL_FORMAT_TITLE),
    excelFormatText: t(AdvancedViewI18nKeys.EXCEL_FORMAT_TEXT),
    containerClassName: 'rounded border-l-[2px] border-semantic-warning py-2',
    largeQueryClassName: '!text-neutrals-1000 h4 text-xs',
    limitMessageClassName: 'font-normal',
  };

  const datasetInfoOptions: DatasetInfoOptions = {
    isShowAgency: true,
    isShowDatasetBadge: false,
  };

  const signOutAction = () => {
    signOut();
  };

  const handleInvalidStreaming = useCallback((error: HttpError) => {
    const status = error.status;
    if (status === HTTP_ERROR_CODES.UNAUTHORIZED) {
      signOut();
    }
  }, []);

  if (isConversationNotFound) {
    return (
      <>
        <WelcomeView />
        {showNotFoundAlert && (
          <Alert
            alertDetails={{
              type: AlertType.ERROR,
              title: t(ChatI18nKeys.CONVERSATION_ACCESS_ERROR_TITLE),
              text: t(ChatI18nKeys.CONVERSATION_ACCESS_ERROR_TEXT),
            }}
            errorIcon={<ErrorIcon className="size-6 text-semantic-error" />}
            onClose={() => setShowNotFoundAlert(false)}
          />
        )}
      </>
    );
  }

  return (
    <div
      className={classNames(
        'flex flex-row justify-center h-full w-full bg-white',
      )}
    >
      <div
        className={classNames(
          'flex flex-col h-full',
          isOpenedAdvancedView
            ? 'w-[422px] border border-neutrals-400'
            : 'w-full',
        )}
      >
        <div className={classNames('flex-1 min-h-0')}>
          <ConversationView
            conversationKey={conversationKey}
            conversation={conversation}
            titles={conversationViewTitles}
            actions={conversationViewActions}
            locale={locale}
            handleInvalidStreaming={handleInvalidStreaming}
            onConversationNotFound={handleConversationNotFound}
            signOutAction={signOutAction}
            messageStyles={{
              advanceViewIcon: <AdvancedModeIcon className="size-4" />,
              processingTitle: t(MessageI18nKeys.PROCESSING_REVIEW),
              openAdvanceViewTitle: t(
                AdvancedViewI18nKeys.OPENED_IN_ADVANCED_VIEW,
              ),
              systemMessageIcon: <MessageIcon width={44} height={44} />,
              messagesWrapperClass: isOpenedAdvancedView
                ? 'p-4'
                : 'pt-8 pl-[15%] pr-[8%]',
            }}
            attachmentsStyles={{
              openAdvancedViewIcon: (
                <UnfoldIcon
                  width={16}
                  height={16}
                  className="text-neutrals-1000"
                />
              ),
              ...attachmentsStyles,
              codeAttachmentContainerClassName: 'h-[350px]',
              copyTitle: undefined,
              copiedTitle: undefined,
              copiedTooltip: t(ChatI18nKeys.SHARE_COPIED_LINK),
              copyIcon: <Copy className="size-5" />,
              copiedIcon: <CheckIcon className="size-5" />,
            }}
            inputMessageStyles={{
              inputContainerClass: !isOpenedAdvancedView
                ? 'pl-[15%] pr-[8%]'
                : 'px-4',
              sendMessageIcon: <IconSend />,
            }}
            shareConversationProps={shareConversationProps}
            formattingSettings={formatNumbers}
            metadataSettings={{
              isMetadataDescription: true,
            }}
            expandStagesIcon={<IconChevronRight className="size-5" />}
            conversationsRoute={ApplicationRoute.Conversations}
            token={token?.access_token as string}
            dataQuery={currentDataQuery}
            setConversation={setConversation}
            setConversations={setConversations}
            openUrl={openUrl}
            messageActionsIcons={messageActionsIcons}
            editMessageTitles={{
              cancel: t(ConversationI18nKeys.CANCEL),
              send: t(ConversationI18nKeys.SEND),
            }}
            scrollBottomIcon={<Down width={20} height={20} />}
            limitMessages={limitMessages}
          >
            <Footer />
          </ConversationView>
        </div>
      </div>
      {isOpenedAdvancedView && (
        <AdvancedView
          advanceViewStyles={{
            isShowShare: true,
          }}
          actions={attachmentsActions}
          filtersProps={{
            actions: {
              getConstraints: authHandler(getConstraintsApi),
              getAvailableHierarchies: authHandler(getAvailableHierarchiesApi),
              getHierarchy: authHandler(getHierarchyApi),
            },
            buttonProps: {
              title: t(AdvancedViewI18nKeys.FILTERS),
              isShowBadge: true,
            },
            modalProps: {
              isShowCancelButton: true,
              isShowTimeSeriesCount: true,
              isShowClearIcon: true,
              isShowClearAllButton: !isCrossDatasetModeOn,
              footerActionsPosition: isCrossDatasetModeOn ? 'right' : 'left',
              filterValuesProps: {
                searchIconSize: 16,
                checkboxIcon: (
                  <IconSquareCheckFilled
                    width={18}
                    height={18}
                    className="absolute"
                  />
                ),
                calendarIcon: <IconCalendarWeek className="size-4" />,
                radioIcon: <IconCircleFilled className="size-3" />,
                dateFormat: 'm-d-Y',
              },
              resetIcon: <Reset />,
            },
            datasetIcon: <Dataset />,
            timeRangeOptions,
            conversation,
            conversationKey,
            setConversation,
            updateConversation: authHandler(updateConversationApi),
          }}
          attachmentsProps={{
            currentDataQuery,
            dataQueries,
            datasets,
            styles: attachmentsStyles,
          }}
          shareConversationProps={shareConversationProps}
          formattingSettings={formatNumbers}
          limitMessages={limitMessages}
          metadataSettings={{
            isMetadataDescription: true,
          }}
          locale={locale}
          datasetInfoOptions={datasetInfoOptions}
          titles={conversationViewTitles}
        />
      )}
    </div>
  );
};

export default ConversationViewWrapper;
