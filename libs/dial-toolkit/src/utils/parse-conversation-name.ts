import { Entity } from '@epam/ai-dial-shared';

import { CreateConversationRequest } from '../models/conversation';
import { getClearedConversationName } from '@epam/statgpt-shared-toolkit';

export const parseConversationName = (item: Entity) => {
  // Extract conversation info from the name field
  // Format: {modelId}__{name} or {modelId}__{name}__{version}
  const nameParts = item.name?.split('__') || [];
  const conversationName =
    nameParts.length > 1 ? nameParts.slice(1).join('__') : item.name;
  const modelId = nameParts[0];

  return { modelId, conversationName };
};

export const generateConversationId = (
  data: CreateConversationRequest,
): string => {
  const timestamp = Date.now();
  const nameSlug = getClearedConversationName(data.name);

  // Generate ID without "conversations/" prefix - just folder/name
  // The folderId should be something like "default" or a user folder
  return `${data.folderId}/${nameSlug}-${timestamp}`;
};
