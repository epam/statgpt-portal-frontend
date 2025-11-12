import {
  getHeaders,
  RequestOptions,
  sendRequest,
  getConversationUrlWithoutLocale,
} from '@epam/statgpt-shared-toolkit';
import { getIsInvalidSession } from '../../../../utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '../../../../constants/auth';
import { getUserToken } from '../../../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../../../utils/auth/get-auth-toggle';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ResourceTypes,
  ConversationResource,
  DIAL_API_ROUTES,
} from '@epam/statgpt-dial-toolkit';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; invitationId: string }>;
}) {
  const { locale, invitationId } = await params;

  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  const requestHeaders = getHeaders(void 0, {
    jwt: token?.access_token as string,
  });
  const options: RequestOptions = {
    method: 'GET',
  };

  await sendRequest(
    `${process.env.DIAL_API_URL}${DIAL_API_ROUTES.SHARE_CONVERSATION_ACCEPT(invitationId)}`,
    requestHeaders,
    options,
  );

  const conversationDetailsResponse = await sendRequest(
    `${process.env.DIAL_API_URL}${DIAL_API_ROUTES.SHARE_CONVERSATION_DETAILS(invitationId)}`,
    requestHeaders,
    options,
  );

  let sharedConversationDetails;

  try {
    sharedConversationDetails = await conversationDetailsResponse.json();
  } catch {
    redirect('/');
  }

  const conversationResource = sharedConversationDetails?.resources?.find(
    (resource: ConversationResource) =>
      resource?.url?.includes(ResourceTypes.CONVERSATION?.toLowerCase()),
  );

  const conversationUrl = getConversationUrlWithoutLocale(
    conversationResource?.url,
    locale,
  );

  redirect(`/${locale}/${conversationUrl}`);
}
