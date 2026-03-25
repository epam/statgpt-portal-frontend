import ConversationViewWrapper from '../../../../components/ConversationView/ConversationViewWrapper';
import { SIGN_IN_LINK } from '../../../../constants/auth';
import { getUserToken } from '../../../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../../../utils/auth/get-auth-toggle';
import { getIsInvalidSession } from '../../../../utils/auth/is-valid-session';
import { ConversationViewSidePanelProvider } from '@epam/statgpt-conversation-view';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id } = await params;
  // Join the array parts to reconstruct the full conversation ID
  const bucketId = id[0];
  const conversationId = id.slice(1).join('/');

  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  return (
    <ConversationViewSidePanelProvider>
      <ConversationViewWrapper
        bucketId={bucketId}
        conversationId={conversationId}
        token={token}
      />
    </ConversationViewSidePanelProvider>
  );
}
