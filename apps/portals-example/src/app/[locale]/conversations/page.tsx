import { FormSchemaButtonOption } from '@epam/ai-dial-shared';
import Footer from '../../../components/Footer/Footer';
import WelcomeView from '../../../components/WelcomeView/WelcomeView';
import { apiLogger } from '../../../core/logger';
import { getDeploymentConfiguration } from '../../actions/configuration';
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

  let suggestionsList: FormSchemaButtonOption[] = [];
  let welcomeText = '';

  try {
    const configuration = await getDeploymentConfiguration();
    suggestionsList = configuration.suggestionsList;
    welcomeText = configuration.welcomeText;
  } catch (error) {
    apiLogger.error(`Failed to fetch deployment configuration: ${error}`);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <WelcomeView
          suggestionsList={suggestionsList}
          welcomeText={welcomeText}
        />
      </div>
      <Footer />
    </div>
  );
}
