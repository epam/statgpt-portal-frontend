export const getConversationUrlWithoutLocale = (
  resourceUrl: string,
  locale: string,
) => {
  return resourceUrl
    ?.split('/')
    ?.filter((item: string) => item !== locale)
    ?.join('/');
};
