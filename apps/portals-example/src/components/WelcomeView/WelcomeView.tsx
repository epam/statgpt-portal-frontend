'use client';

import { FormSchemaButtonOption } from '@epam/ai-dial-shared';
import {
  ConversationWelcome,
  ConversationViewTitles,
} from '@epam/statgpt-conversation-view';
import WelcomeTitleIcon from '../../../public/images/logo-small.svg';
import { getBucket } from '../../app/actions/bucket';
import {
  createConversation,
  getConversations,
  getSharedConversations,
} from '../../app/actions/conversations';
import { ApplicationRoute } from '../../types/application-routes';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo } from 'react';
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
import { SIGN_IN_LINK } from '../../constants/auth';
import { wrapWithAuthHandler } from '../../utils/auth/requests-wrapper';

interface Props {
  suggestionsList: FormSchemaButtonOption[];
  welcomeText: string;
}

const WelcomeView: FC<Props> = ({ suggestionsList, welcomeText }) => {
  const t = useI18n();
  const router = useRouter();
  const { setConversations, setSharedConversations } = useConversationList();
  const locale = useCurrentLocale();

  const authHandler = useCallback(
    function <Args extends any[], T>(
      action: (...args: Args) => Promise<ApiResponse<T>>,
    ): (...args: Args) => Promise<T> {
      return wrapWithAuthHandler(action, () => {
        router.push(SIGN_IN_LINK);
      });
    },
    [router],
  );

  const serverActions = useMemo(
    () => ({
      getBucket: authHandler(getBucket),
      createConversation: authHandler(createConversation),
      getConversations: authHandler(getConversations),
      getSharedConversations: authHandler(getSharedConversations),
    }),
    [authHandler],
  );

  const handleConversationSelect = (
    folderId: string,
    conversationKey: string,
  ) => {
    const navPath = getConversationNavPath(folderId, conversationKey);
    router.push(`/${locale}/${ApplicationRoute.Conversations}/${navPath}`);
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
      titleIcon={<WelcomeTitleIcon className="w-9 h-9 mr-4" />}
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
