'use client';
import { createContext, ReactNode, useContext } from 'react';
import {
  MessageStyles,
  MessageActionIcons,
  MessageActionTitles,
  EditMessageTitles,
} from '../models/message';
import { AttachmentsStyles } from '../models/attachments-styles';
import { AttachmentsConfig } from '../models/attachments';
import { LimitMessages } from '@epam/statgpt-ui-components';
import { FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import { ConversationViewTitles } from '../models/titles';

export interface ConversationViewStyles {
  titles?: ConversationViewTitles;
  messageStyles?: MessageStyles;
  attachmentsStyles?: AttachmentsStyles;
  formattingSettings?: FormatNumbersType;
  messageActionsIcons?: MessageActionIcons;
  messageActionsTitles?: MessageActionTitles;
  editMessageTitles?: EditMessageTitles;
  expandStagesIcon?: ReactNode;
  scrollBottomIcon?: ReactNode;
  limitMessages?: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
}

const ConversationViewStylesContext =
  createContext<ConversationViewStyles | null>(null);

export function ConversationViewStylesProvider({
  children,
  styles,
}: {
  children: ReactNode;
  styles?: ConversationViewStyles;
}) {
  return (
    <ConversationViewStylesContext.Provider value={styles ?? {}}>
      {children}
    </ConversationViewStylesContext.Provider>
  );
}

export function useConversationViewStyles(): ConversationViewStyles {
  const context = useContext(ConversationViewStylesContext);
  if (!context) {
    throw new Error(
      'useConversationViewStyles must be used within ConversationViewStylesProvider',
    );
  }
  return context;
}
