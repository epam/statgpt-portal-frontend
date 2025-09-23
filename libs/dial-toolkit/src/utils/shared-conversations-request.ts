import { ResourceTypes, ShareTarget } from '../constants/share-conversation';

export const getSharedConversationsRequest = (shareTarget: ShareTarget) => {
  return { resourceTypes: [ResourceTypes.CONVERSATION], with: shareTarget };
};
