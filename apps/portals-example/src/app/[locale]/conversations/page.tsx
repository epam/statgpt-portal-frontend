import Footer from '../../../components/Footer/Footer';
import WelcomeView from '../../../components/WelcomeView/WelcomeView';
import { getSignInLink } from '../../../constants/auth';
import { ApplicationRoute } from '../../../types/application-routes';
import { getUserToken } from '../../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../../utils/auth/get-auth-toggle';
import { getIsInvalidSession } from '../../../utils/auth/is-valid-session';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

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
    return redirect(
      getSignInLink(`/${locale}${ApplicationRoute.Conversations}`),
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <WelcomeView />
      </div>
      <Footer />
    </div>
  );
}
