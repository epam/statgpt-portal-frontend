import { redirect } from 'next/navigation';
import { ApplicationRoute } from '../../types/application-routes';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { SIGN_IN_LINK } from '../../constants/auth';
import { getUserToken } from '../../utils/auth/auth-request';
import { cookies, headers } from 'next/headers';
import { getIsInvalidSession } from '../../utils/auth/is-valid-session';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  redirect(ApplicationRoute.Conversations);
}
