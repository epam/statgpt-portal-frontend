export const getClearedConversationName = (
  conversationName?: string,
): string => {
  return (
    conversationName
      ?.toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-/g, ' ') || ''
  );
};
