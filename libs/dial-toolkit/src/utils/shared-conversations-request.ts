import {
  ResourceTypes,
  ShareTarget,
} from '@statgpt/dial-toolkit/src/constants/share-conversation';

export const getSharedConversationsRequest = (shareTarget: ShareTarget) => {
  return { resourceTypes: [ResourceTypes.CONVERSATION], with: shareTarget };
};
