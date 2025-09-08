export function getConversationNavPath(
  folderId: string,
  conversationKey: string,
): string {
  const bucketId = folderId.split('/')[0];
  const conversationId = conversationKey.split('/').pop();

  return `${bucketId}/${conversationId}`;
}
