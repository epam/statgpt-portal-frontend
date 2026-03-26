import Footer from '../../../components/Footer/Footer';
import WelcomeView from '../../../components/WelcomeView/WelcomeView';
import { SIGN_IN_LINK } from '../../../constants/auth';
import { getUserToken } from '../../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../../utils/auth/get-auth-toggle';
import { getIsInvalidSession } from '../../../utils/auth/is-valid-session';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
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
