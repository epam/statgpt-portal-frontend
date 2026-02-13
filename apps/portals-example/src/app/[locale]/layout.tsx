import {
  AdvancedViewProvider,
  OnboardingProvider,
  ChatMessagesProvider,
} from '@epam/statgpt-conversation-view';
import ConversationListWrapper from '../../components/ConversationList/ConversationListWrapper';
import { ConversationListProvider } from '../../context/ConversationListContext';
import { I18nProvider } from '../../locales/client';
import { SIGN_IN_LINK } from '../../constants/auth';
import { getUserToken } from '../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { getIsInvalidSession } from '../../utils/auth/is-valid-session';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { getDeploymentConfiguration } from '../actions/configuration';
import { DeploymentConfigProvider } from '../../context/DeploymentConfigProvider';
import { conversationApi, dialApiClient } from '../api/api';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { NoAccessView } from '../../components/NoAccessView';
import { ComponentsConfig } from '../../components/ComponentsConfig/ComponentsConfig';
import { TextsConfig } from '../../components/TextsConfig/TextsConfig';
import { ClientProvidersWrapper } from '../../components/ClientProvidersWrapper/ClientProvidersWrapper';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  const { locale } = await params;

  const configuration = await getDeploymentConfiguration();
  let isAnyConversationAvailable = false;

  if (!configuration.success) {
    try {
      const bucket = await dialApiClient.getRequest<{ bucket: string }>(
        DIAL_API_ROUTES.BUCKET,
        token?.access_token as string,
      );

      const conversations = await conversationApi.getConversations(
        token?.access_token as string,
        bucket.bucket,
        locale,
      );

      isAnyConversationAvailable = conversations.length > 0;
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }

  const clientContactSupportUrl = process.env.CLIENT_CONTACT_SUPPORT_URL;

  const getContent = () => {
    if (!configuration.success && !isAnyConversationAvailable) {
      return <NoAccessView clientContactSupportUrl={clientContactSupportUrl} />;
    }

    return (
      <DeploymentConfigProvider config={configuration.data}>
        <ClientProvidersWrapper isAgentAvailable={configuration.success}>
          <OnboardingProvider>
            <AdvancedViewProvider>
              <ConversationListProvider>
                <ChatMessagesProvider>
                  <ConversationListWrapper />
                  <main className="flex-1 h-full min-w-0">{children}</main>
                </ChatMessagesProvider>
              </ConversationListProvider>
            </AdvancedViewProvider>
          </OnboardingProvider>
        </ClientProvidersWrapper>
      </DeploymentConfigProvider>
    );
  };

  return (
    <I18nProvider locale={locale}>
      <div className="flex h-full flex-row w-full main-layout">
        <ComponentsConfig>
          <TextsConfig clientContactSupportUrl={clientContactSupportUrl}>
            {getContent()}
          </TextsConfig>
        </ComponentsConfig>
      </div>
    </I18nProvider>
  );
}
