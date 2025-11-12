import {
  AdvancedViewProvider,
  OnboardingProvider,
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
  return (
    <I18nProvider locale={(await params).locale}>
      <div className="flex h-full flex-row w-full main-layout">
        <OnboardingProvider>
          <AdvancedViewProvider>
            <ConversationListProvider>
              <ConversationListWrapper />
              <main className="flex-1 h-full min-w-0">{children}</main>
            </ConversationListProvider>
          </AdvancedViewProvider>
        </OnboardingProvider>
      </div>
    </I18nProvider>
  );
}
