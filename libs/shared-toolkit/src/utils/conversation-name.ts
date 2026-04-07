export const deleteConversationNamePostfix = (
  conversationName?: string,
): string => conversationName?.split(/-\d+$/)[0] ?? '';

const isLetterOrDigit = (char: string): boolean =>
  /\p{L}/u.test(char) || /\p{N}/u.test(char);

export const getClearedConversationName = (
  conversationName?: string,
): string => {
  if (!conversationName) return '';

  const lower = conversationName.toLowerCase();
  const words: string[] = [];
  let word = '';

  for (const char of lower) {
    if (isLetterOrDigit(char)) {
      word += char;
    } else if (word) {
      words.push(word);
      word = '';
    }
  }

  if (word) {
    words.push(word);
  }

  return words.join(' ');
};
