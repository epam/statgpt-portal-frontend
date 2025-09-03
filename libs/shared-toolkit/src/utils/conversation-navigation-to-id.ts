export function getConversationId(idParams: string[], locale: string): string {
  return `${idParams?.[0]}/${locale}/${idParams?.[1]}`;
}
