const MAX_ENTITY_LENGTH = 160;
const notAllowedSymbols = ':;,=/{}%&\\"';

const notAllowedSymbolsRegex = new RegExp(
  `[${notAllowedSymbols}]|(\r\n|\n|\r|\t)|[\x00-\x1F]`,
  'gm',
);

export const getCreateConversationRequest = (
  bucket: string,
  locale: string,
  defaultName: string,
  prompt?: string,
) => {
  const newName = prepareEntityName(
    prompt || `${defaultName} ${new Date().toLocaleDateString()}`,
  );
  return {
    name: newName,
    folderId: `${bucket}/${locale}`,
    prompt,
  };
};

export const prepareEntityName = (prompt?: string) => {
  const clearName =
    prompt
      ?.replace(/\r\n|\r/gm, '\n')
      .split('\n')
      .map((s) => s.replace(notAllowedSymbolsRegex, ' ').trim())
      .filter(Boolean)[0] ?? '';

  const result =
    clearName.length > MAX_ENTITY_LENGTH
      ? clearName.substring(0, MAX_ENTITY_LENGTH)
      : clearName;

  return result.trim();
};
