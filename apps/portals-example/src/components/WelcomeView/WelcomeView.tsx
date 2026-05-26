'use client';

import {
  ConversationWelcome,
  ConversationViewTitles,
} from '@epam/statgpt-conversation-view';
import { getBucketApi } from '../../app/api/bucket/client';
import {
  createConversationApi,
  getConversationsApi,
} from '../../app/api/conversations/client';
import { getSharedConversationsApi } from '../../app/api/share/client';
import { ApplicationRoute } from '../../types/application-routes';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useConversationList } from '../../context/ConversationListContext';
import { IconSend } from '@tabler/icons-react';
import {
  getConversationNavPath,
  ApiResponse,
} from '@epam/statgpt-shared-toolkit';
import { useCurrentLocale, useI18n } from '../../locales/client';
import {
  AppI18nKeys,
  AuthI18nKeys,
  NavI18nKeys,
  WelcomeI18nKeys,
} from '../../constants/i18n-keys';
import { getSignInLink } from '../../constants/auth';
import { wrapWithAuthHandler } from '../../utils/auth/requests-wrapper';
import { useDeploymentConfig } from '../../context/DeploymentConfigProvider';

const WelcomeView = () => {
  const t = useI18n();
  const router = useRouter();
  const { setConversations, setSharedConversations } = useConversationList();
  const locale = useCurrentLocale();
  const {
    suggestionsList,
    welcomeText,
    welcomeDescription,
    welcomeInputPlaceholder,
  } = useDeploymentConfig();

  const authHandler = useCallback(
    function <Args extends any[], T>(
      action: (...args: Args) => Promise<ApiResponse<T>>,
    ): (...args: Args) => Promise<T> {
      return wrapWithAuthHandler(action, () => {
        router.push(getSignInLink(window.location.href));
      });
    },
    [router],
  );

  const serverActions = useMemo(
    () => ({
      getBucket: authHandler(getBucketApi),
      createConversation: authHandler(createConversationApi),
      getConversations: authHandler(getConversationsApi),
      getSharedConversations: authHandler(getSharedConversationsApi),
    }),
    [authHandler],
  );

  const handleConversationSelect = (
    folderId: string,
    conversationKey: string,
  ) => {
    const navPath = getConversationNavPath(folderId, conversationKey);
    router.push(`/${locale}${ApplicationRoute.Conversations}/${navPath}`);
  };

  const conversationViewTitles: ConversationViewTitles = {
    newChat: t(NavI18nKeys.NEW_CHAT),
    welcomeTitle: t(WelcomeI18nKeys.TITLE),
    askAnything: t(WelcomeI18nKeys.ASK_ANYTHING),
    close: t(AppI18nKeys.CLOSE),
    signOut: t(AuthI18nKeys.SIGN_OUT),
  };

  return (
    <ConversationWelcome
      locale={locale}
      titles={conversationViewTitles}
      suggestionsList={suggestionsList}
      welcomeText={welcomeText}
      welcomeDescription={welcomeDescription}
      welcomeInputPlaceholder={welcomeInputPlaceholder}
      handleConversationClick={handleConversationSelect}
      actions={serverActions}
      inputMessageStyles={{
        inputContainerClass: 'max-w-[784px] mb-6',
        sendMessageIcon: <IconSend />,
      }}
      setConversations={setConversations}
      setSharedConversations={setSharedConversations}
    />
  );
};

export default WelcomeView;
