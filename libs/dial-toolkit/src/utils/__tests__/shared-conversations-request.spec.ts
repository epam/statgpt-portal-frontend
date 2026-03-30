import { ResourceTypes, ShareTarget } from '../../constants/share-conversation';
import { getSharedConversationsRequest } from '../shared-conversations-request';

// ---------------------------------------------------------------------------
// getSharedConversationsRequest
// ---------------------------------------------------------------------------

describe('getSharedConversationsRequest', () => {
  it('returns an object with resourceTypes containing CONVERSATION for ShareTarget.ME', () => {
    const result = getSharedConversationsRequest(ShareTarget.ME);
    expect(result.resourceTypes).toEqual([ResourceTypes.CONVERSATION]);
  });

  it('sets the with field to the provided share target for ShareTarget.ME', () => {
    const result = getSharedConversationsRequest(ShareTarget.ME);
    expect(result.with).toBe(ShareTarget.ME);
  });

  it('returns an object with resourceTypes containing CONVERSATION for ShareTarget.OTHERS', () => {
    const result = getSharedConversationsRequest(ShareTarget.OTHERS);
    expect(result.resourceTypes).toEqual([ResourceTypes.CONVERSATION]);
  });

  it('sets the with field to the provided share target for ShareTarget.OTHERS', () => {
    const result = getSharedConversationsRequest(ShareTarget.OTHERS);
    expect(result.with).toBe(ShareTarget.OTHERS);
  });

  it('resourceTypes array contains exactly one entry', () => {
    const result = getSharedConversationsRequest(ShareTarget.ME);
    expect(result.resourceTypes).toHaveLength(1);
  });

  it('returns a new object on each call', () => {
    const first = getSharedConversationsRequest(ShareTarget.ME);
    const second = getSharedConversationsRequest(ShareTarget.ME);
    expect(first).not.toBe(second);
  });
});
