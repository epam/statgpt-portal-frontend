import { redirect } from 'next/navigation';
import { ApplicationRoute } from '../../types/application-routes';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { getSignInLink } from '../../constants/auth';
import { getUserToken } from '../../utils/auth/auth-request';
import { cookies, headers } from 'next/headers';
import { getIsInvalidSession } from '../../utils/auth/is-valid-session';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(getSignInLink(`/${locale}`));
  }

  redirect(ApplicationRoute.Conversations);
}
