/**
 * Type-safe translation keys for internationalization
 * Organized by feature/domain for better maintainability
 */

export enum AppI18nKeys {
  TITLE_GLOBAL = 'app.titleGlobal',
  TITLE = 'app.title',
  FOOTER = 'app.footer',
  EXPAND = 'app.expand',
  COLLAPSE = 'app.collapse',
  CLOSE = 'app.close',
  SEARCH = 'app.search',
  CANCEL = 'app.cancel',
}

export enum AuthI18nKeys {
  AUTHORIZATION = 'auth.authorization',
  ERROR_TITLE = 'auth.errorTitle',
  ERROR_DESCRIPTION = 'auth.errorDescription',
  SIGN_OUT = 'auth.signOut',
}

export enum NavI18nKeys {
  NEW_CHAT = 'nav.newChat',
  SETTINGS = 'nav.settings',
}

export enum ChatI18nKeys {
  SHARE = 'chat.share',
  SHARE_LINK_TITLE = 'chat.shareLinkTitle',
  SHARE_LINK_DESCRIPTION = 'chat.shareLinkDescription',
  SHARE_CREATE_LINK = 'chat.createLink',
  SHARE_COPY_LINK = 'chat.copyLink',
  SHARE_COPIED_LINK = 'chat.copied',
  SHARE_REMOVE_ACCESS_TO_USERS = 'chat.removeAccessToUsers',
  CHAT_NAME = 'chat.chatName',
  CHAT_EXPIRATION = 'chat.chatExpiration',
  CHAT_EXPIRATION_DAYS = 'chat.chatExpirationDays',
  CHAT_WARNING = 'chat.chatWarning',
  DUPLICATE_CHAT = 'chat.duplicateChat',
  EXPLORE_DATA = 'chart.exploreData',
}

export enum LogOutI18nKeys {
  SIGN_OUT = 'user.signOut',
  SETTINGS = 'user.settings',
  POPUP_TITLE = 'user.popupTitle',
  POPUP_TEXT = 'user.popupText',
  POPUP_APPLY = 'user.popupApply',
  POPUP_CANCEL = 'user.popupCancel',
}

export enum AdvancedViewI18nKeys {
  TITLE = 'advancedView.title',
  DATASET = 'advancedView.dataset',
  AGENCY = 'advancedView.agency',
  LAST_UPDATED = 'advancedView.lastUpdated',
  OPENED_IN_ADVANCED_VIEW = 'advancedView.openedInAdvancedView',
  FILTERS = 'advancedView.filters',
  FILTER = 'advancedView.filter',
  CONTENT = 'advancedView.content',
  CLEAR_ALL = 'advancedView.clearAll',
  CLEAR_ALL_FILTERS = 'advancedView.clearAllFilters',
  RESET_SELECTED_VALUES = 'advancedView.resetSelectedValues',
  DISPLAY_ORDER = 'advancedView.displayOrder',
  FLAT_LIST = 'advancedView.list',
  HIERARCHY = 'advancedView.hierarchy',
  SETTINGS = 'advancedView.settings',
  APPLIED = 'advancedView.applied',
  APPLY = 'advancedView.apply',
  CANCEL = 'advancedView.cancel',
  TIMESERIES = 'advancedView.timeseries',
  CUSTOM_PERIOD = 'advancedView.customPeriod',
  ALL_PERIODS = 'advancedView.allPeriods',
  YEARS = 'advancedView.years',
  FROM = 'advancedView.from',
  TO = 'advancedView.to',
  ALL = 'advancedView.all',
  METADATA = 'advancedView.metadata',
  OBSERVATION = 'advancedView.observation',
  NO_METADATA = 'advancedView.noMetadata',
  CHART_NO_DATA = 'advancedView.chartingNoData',
  LARGE_QUERY = 'advancedView.largeQuery',
  SHOWING_LIMIT = 'advancedView.showingLimit',
  DOWNLOAD_MESSAGE = 'advancedView.downloadMessage',
  REFINE_IN_ADVANCED_VIEW = 'advancedView.showInAdvancedView',
  DATA_EXPLORER = 'advancedView.dataExplorer',
  EXCEL_FORMAT_TITLE = 'advancedView.excelFormatTitle',
  EXCEL_FORMAT_TEXT = 'advancedView.excelFormatText',
  FULL_LIMIT_MESSAGE = 'advancedView.fullLimitMessage',
}

export enum MessageI18nKeys {
  STREAMING = 'message.streaming',
  PROCESSING_REVIEW = 'message.processingReview',
  QUERY_UPDATED_MANUALLY = 'message.queryUpdatedManually',
  SET_TO = 'message.setTo',
  LOADING = 'message.loading',
}

export enum ConversationI18nKeys {
  DELETE = 'conversation.delete',
  EXPORT = 'conversation.export',
  DELETE_TITLE = 'conversation.deleteTitle',
  DELETE_CONFIRM = 'conversation.deleteConfirm',
  NO_CONVERSATIONS = 'conversation.noConversations',
  NO_ACTIONS_ALLOWED = 'conversation.noActionsAllowed',
  CLICK_NEW_CHAT = 'conversation.clickNewChat',
  ALL_CHATS = 'conversation.allChats',
  SHARED = 'conversation.shared',
  CHAT = 'conversation.chat',
  CANCEL = 'conversation.cancel',
  SEND = 'conversation.send',
  RENAME = 'conversation.rename',
  RENAME_TITLE = 'conversation.renameTitle',
  SAVE = 'conversation.save',
}

export enum StatusMessagesI18nKeys {
  AGENT_UNAVAILABLE_TITLE = 'statusMessages.agentUnavailable.title',
  AGENT_UNAVAILABLE_TEXT = 'statusMessages.agentUnavailable.text',
  AGENT_UNAVAILABLE_ALERT = 'statusMessages.agentUnavailable.alert',
  CONTACT_SUPPORT = 'statusMessages.contactSupport',
}

export enum AttachmentsI18nKeys {
  DOWNLOAD = 'attachments.download',
  OPEN_URL = 'attachments.openUrl',
  DATA_GRID = 'attachments.dataGrid',
  CHART = 'attachments.chart',
  LIMITS = 'attachments.limits',
  TIME_SERIES_LIMIT = 'attachments.timeSeries',
  CHART_INFO = 'attachments.chartInfo',
  LIMITS_INFO_P1_1 = 'attachments.limitInfo_p1_part1',
  LIMITS_INFO_P1_2 = 'attachments.limitInfo_p1_part2',
  LIMITS_INFO_P1_3 = 'attachments.limitInfo_p1_part3',
  LIMITS_INFO_P2_1 = 'attachments.limitInfo_p2_part1',
  LIMITS_INFO_P2_2 = 'attachments.limitInfo_p2_part2',
  LIMITS_INFO_P2_3 = 'attachments.limitInfo_p2_part3',
  LIMITS_INFO_P2_4 = 'attachments.limitInfo_p2_part4',
  LIMITS_INFO_P2_5 = 'attachments.limitInfo_p2_part5',
  LIMITS_INFO_LINK = 'attachments.limitInfo_link',
}

export enum TimeI18nKeys {
  QUARTERLY = 'time.quarterly',
  MONTHLY = 'time.monthly',
}

export enum DateGroupsI18nKeys {
  TODAY = 'dateGroups.today',
  YESTERDAY = 'dateGroups.yesterday',
  LAST_WEEK = 'dateGroups.lastWeek',
  EARLIER = 'dateGroups.earlier',
}

export enum WelcomeI18nKeys {
  TITLE = 'welcome.title',
  ASK_ANYTHING = 'welcome.askAnything',
}

export enum DownloadI18nKeys {
  DOWNLOAD = 'download.download',
  DOWNLOAD_TYPE = 'download.downloadType',
  DATASET = 'download.dataset',
  DATA_FORMAT = 'download.dataFormat',
  METADATA = 'download.metadata',
  ALL = 'download.all',
  NONE = 'download.none',
  INCLUDE_METADATA = 'download.includeMetadata',
  FULL_DATASET = 'download.fullDataset',
  ATTRIBUTES = 'download.attributes',
  ID = 'download.id',
  ID_DESCRIPTION = 'download.idDescription',
  NAME = 'download.name',
  NAME_DESCRIPTION = 'download.nameDescription',
  ID_NAME = 'download.idName',
  ID_NAME_DESCRIPTION = 'download.idNameDescription',
  PARTIAL_DATASET = 'download.partialDataset',
}

// Aggregate all keys for convenience
export const I18nKeys = {
  App: AppI18nKeys,
  Nav: NavI18nKeys,
  Chat: ChatI18nKeys,
  Message: MessageI18nKeys,
  Conversation: ConversationI18nKeys,
  Attachments: AttachmentsI18nKeys,
  Time: TimeI18nKeys,
  DateGroups: DateGroupsI18nKeys,
  Welcome: WelcomeI18nKeys,
  Download: DownloadI18nKeys,
} as const;

// Type helper for all translation keys
export type TranslationKey =
  | AppI18nKeys
  | NavI18nKeys
  | ChatI18nKeys
  | MessageI18nKeys
  | ConversationI18nKeys
  | WelcomeI18nKeys;
