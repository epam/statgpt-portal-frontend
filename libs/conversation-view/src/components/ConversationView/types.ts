import { Conversation, ConversationInfo } from '@epam/ai-dial-shared';
import {
  DataQuery,
  FormatNumbersType,
  HttpError,
} from '@epam/statgpt-shared-toolkit';
import { LimitMessages } from '@epam/statgpt-ui-components';
import { Dispatch, ReactNode, SetStateAction } from 'react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';

import { ConversationViewActions } from '../../models/actions';
import { AttachmentsConfig } from '../../models/attachments';
import { AttachmentsStyles } from '../../models/attachments-styles';
import {
  EditMessageTitles,
  InputMessageStyles,
  MessageActionIcons,
  MessageActionTitles,
  MessageStyles,
} from '../../models/message';
import { MetadataSettings } from '../../models/metadata';
import { ConversationViewTitles } from '../../models/titles';

export interface ConversationViewProps {
  conversationKey: string;
  conversation: Conversation | null;
  actions: ConversationViewActions;
  messageStyles?: MessageStyles;
  attachmentsStyles?: AttachmentsStyles;
  inputMessageStyles: InputMessageStyles;
  shareConversationProps?: ShareConversationProps;
  showConversationHeaderAdvancedView?: boolean;
  formattingSettings?: FormatNumbersType;
  metadataSettings?: MetadataSettings;
  titles?: ConversationViewTitles;
  expandStagesIcon?: ReactNode;
  locale: string;
  conversationsRoute?: string;
  token?: string | null;
  dataQuery?: DataQuery;
  signOutTitle?: string;
  setConversation: Dispatch<SetStateAction<Conversation | null>>;
  setConversations: (conversations: ConversationInfo[]) => void;
  openUrl: (url: string) => void;
  signOutAction?: () => void;
  handleInvalidStreaming?: (error: HttpError) => void;
  onConversationNotFound?: () => void;
  messageActionsIcons?: MessageActionIcons;
  messageActionsTitles?: MessageActionTitles;
  editMessageTitles: EditMessageTitles;
  scrollBottomIcon?: ReactNode;
  isFinalMessage?: boolean;
  limitMessages: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
  headerRightSlot?: ReactNode;
  children?: ReactNode;
}
