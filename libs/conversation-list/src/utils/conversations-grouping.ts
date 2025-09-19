import { cloneDeep } from 'lodash';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { GroupedConversations } from '../models/conversation-list';
import { ConversationGroups } from '../types/conversation-groups';
import { ConversationListTitles } from '../models/titles';

const INITIAL_CONVERSATIONS_GROUPS: GroupedConversations = {
  [ConversationGroups.TODAY]: [],
  [ConversationGroups.YESTERDAY]: [],
  [ConversationGroups.WEEK]: [],
  [ConversationGroups.EARLIER]: [],
};

const isToday = (currentDate: Date, updatedDate: Date) => {
  return currentDate.toDateString() === updatedDate.toDateString();
};

const isYesterday = (currentDate: Date, updatedDate: Date) => {
  const yesterday = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() - 1,
  );
  return isToday(updatedDate, yesterday);
};

const getDayDifference = (currentDate: Date, updatedDate: Date) => {
  const diff = currentDate.getTime() - updatedDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getConversationsGroupedByDate = (
  conversations: ConversationInfo[],
): GroupedConversations => {
  const currentDate = new Date();
  const groupedConversations = cloneDeep(INITIAL_CONVERSATIONS_GROUPS);

  for (const conversation of conversations) {
    if (conversation.updatedAt) {
      const updatedDate = new Date(conversation.updatedAt);
      let targetGroup: ConversationInfo[];

      if (isToday(currentDate, updatedDate)) {
        targetGroup = groupedConversations[ConversationGroups.TODAY];
      } else if (isYesterday(currentDate, updatedDate)) {
        targetGroup = groupedConversations[ConversationGroups.YESTERDAY];
      } else if (getDayDifference(currentDate, updatedDate) <= 7) {
        targetGroup = groupedConversations[ConversationGroups.WEEK];
      } else {
        targetGroup = groupedConversations[ConversationGroups.EARLIER];
      }

      if (
        !targetGroup?.some(
          (groupConversation) => groupConversation.id === conversation.id,
        )
      ) {
        targetGroup.push(conversation);
      }
    }
  }

  return groupedConversations;
};

export const sortConversationsByUpdatedAt = (
  groupedConversations: ConversationInfo[],
): ConversationInfo[] => {
  return groupedConversations?.sort(
    (previous, next) => (next?.updatedAt || 0) - (previous?.updatedAt || 0),
  );
};

export const getLabelByGroup = (
  groupLabel: string,
  translations?: ConversationListTitles,
): string => {
  if (groupLabel === ConversationGroups.SHARED) {
    return translations?.shared || 'Shared';
  }
  if (groupLabel === ConversationGroups.TODAY) {
    return translations?.today || 'Today';
  }
  if (groupLabel === ConversationGroups.YESTERDAY) {
    return translations?.yesterday || 'Yesterday';
  }
  if (groupLabel === ConversationGroups.WEEK) {
    return translations?.lastWeek || 'Last week';
  }
  return translations?.earlier || 'Earlier';
};
