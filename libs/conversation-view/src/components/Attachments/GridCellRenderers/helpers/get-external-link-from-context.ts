interface GridContext {
  externalLink?: string;
  externalLinksMap?: Map<string, string>;
}

export function getExternalLinkFromContext(
  context: unknown,
  urn: string | undefined,
): string | undefined {
  const { externalLink, externalLinksMap } = (context as GridContext) ?? {};
  return urn != null && externalLinksMap != null
    ? externalLinksMap.get(urn)
    : externalLink;
}
