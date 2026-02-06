'use client';

import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ConversationList,
  SignOutTitles,
  UserInfo,
  User,
} from '@epam/statgpt-conversation-list';
import MessageIcon from '../../../public/images/message-dots.svg';
import { useAdvancedView } from '@epam/statgpt-conversation-view';
import Logo from '../../../public/images/logo.svg';
import Collapse from '../../../public/images/menu/collapse.svg';
import Share from '../../../public/images/chat/share.svg';
import Delete from '../../../public/images/chat/delete.svg';
import Export from '../../../public/images/chat/export.svg';
import Expand from '../../../public/images/menu/expand.svg';
import Rename from '../../../public/images/chat/rename.svg';
import SignOut from '../../../public/images/sign-out.svg';

import { SHARE_CONVERSATION_PROPS } from '../../constants/share-conversation';
import { getFileBlobApi } from '../../app/api/files/client';
import {
  deleteConversationApi,
  getConversationsApi,
  getConversationApi,
  renameConversationApi,
} from '../../app/api/conversations/client';
import { getSharedConversationsApi } from '../../app/api/share/client';
import { ApplicationRoute } from '../../types/application-routes';
import { useCurrentLocale, useI18n } from '../../locales/client';
import {
  AppI18nKeys,
  ChatI18nKeys,
  ConversationI18nKeys,
  DateGroupsI18nKeys,
  I18nKeys,
  LogOutI18nKeys,
} from '../../constants/i18n-keys';
import { Button } from '@epam/statgpt-ui-components';
import { useConversationList } from '../../context/ConversationListContext';
import {
  getConversationNavPath,
  getConversationId,
} from '@epam/statgpt-shared-toolkit';
import {
  ActionMenuItem,
  ConversationListTitles,
} from '@epam/statgpt-conversation-list';
import { SIGN_IN_LINK } from '../../constants/auth';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { wrapWithAuthHandler } from '../../utils/auth/requests-wrapper';
import { signOut, useSession } from 'next-auth/react';

const ConversationListWrapper = () => {
  const t = useI18n();
  const router = useRouter();
  const { id }: { id: string[] } = useParams();
  const { isOpenedAdvancedView, setIsOpenedAdvancedView } = useAdvancedView();
  const {
    conversations,
    sharedConversations,
    setConversations,
    setSharedConversations,
  } = useConversationList();
  const locale = useCurrentLocale();
  const { data: session } = useSession();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const authHandler = useCallback(
    <Args extends any[], T>(
      action: (...args: Args) => Promise<ApiResponse<T>>,
    ): ((...args: Args) => Promise<T>) => {
      return wrapWithAuthHandler(action, () => {
        router.push(SIGN_IN_LINK);
      });
    },
    [router],
  );

  const actions = useMemo(
    () => ({
      getConversations: authHandler(getConversationsApi),
      getSharedConversations: authHandler(getSharedConversationsApi),
      deleteConversation: authHandler(deleteConversationApi),
      getConversation: authHandler(getConversationApi),
      getFileBlob: authHandler(getFileBlobApi),
      renameConversation: authHandler(
        (source: string, destination: string): any => {
          renameConversationApi(source, destination).then(() =>
            router.push(`/${destination.replace(locale, '')}`),
          );
        },
      ),
    }),
    [authHandler, locale, router],
  );

  const titles: ConversationListTitles = {
    noConversation: t(ConversationI18nKeys.NO_CONVERSATIONS),
    clickNewChat: t(ConversationI18nKeys.CLICK_NEW_CHAT),
    allChats: t(ConversationI18nKeys.ALL_CHATS),
    share: t(ChatI18nKeys.SHARE),
    export: t(ConversationI18nKeys.EXPORT),
    delete: t(ConversationI18nKeys.DELETE),
    deleteTitle: t(ConversationI18nKeys.DELETE_TITLE),
    deleteMessage: t(ConversationI18nKeys.DELETE_CONFIRM),
    cancel: t(AppI18nKeys.CANCEL),
    searchPlaceholder: t(AppI18nKeys.SEARCH),
    shared: t(ConversationI18nKeys.SHARED),
    today: t(DateGroupsI18nKeys.TODAY),
    yesterday: t(DateGroupsI18nKeys.YESTERDAY),
    lastWeek: t(DateGroupsI18nKeys.LAST_WEEK),
    earlier: t(DateGroupsI18nKeys.EARLIER),
    rename: t(ConversationI18nKeys.RENAME),
    renameTitle: t(ConversationI18nKeys.RENAME_TITLE),
    save: t(ConversationI18nKeys.SAVE),
  };

  const onToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  useEffect(() => {
    setIsCollapsed(isOpenedAdvancedView);
  }, [isOpenedAdvancedView]);

  const handleConversationSelect = useCallback(
    (folderId: string, conversationKey: string) => {
      if (isOpenedAdvancedView) {
        setIsOpenedAdvancedView(false);
      }
      const navPath = getConversationNavPath(folderId, conversationKey);
      router.push(`/${locale}${ApplicationRoute.Conversations}/${navPath}`);
    },
    [locale, isOpenedAdvancedView, router, setIsOpenedAdvancedView],
  );

  const handleSelectedConversationRemove = useCallback(() => {
    if (isOpenedAdvancedView) {
      setIsOpenedAdvancedView(false);
    }
    router.push(`/`);
    router.refresh();
  }, [router, isOpenedAdvancedView, setIsOpenedAdvancedView]);

  const redirectToMainView = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleOpeningOfNewConversation = useCallback(() => {
    router.push(`${ApplicationRoute.Conversations}`);

    if (isOpenedAdvancedView) {
      setIsOpenedAdvancedView(false);
    }
  }, [isOpenedAdvancedView, router, setIsOpenedAdvancedView]);

  const signOutAction = useCallback(() => {
    signOut();
  }, []);

  const signOutTitles: SignOutTitles = {
    signOut: t(LogOutI18nKeys.SIGN_OUT),
    settings: t(LogOutI18nKeys.SETTINGS),
    popupTitle: t(LogOutI18nKeys.POPUP_TITLE),
    popupText: t(LogOutI18nKeys.POPUP_TEXT),
    popupApply: t(LogOutI18nKeys.POPUP_APPLY),
    popupCancel: t(LogOutI18nKeys.POPUP_CANCEL),
  };

  const shareTitles = {
    share: t(ChatI18nKeys.SHARE),
    shareLink: t(ChatI18nKeys.SHARE_LINK_TITLE),
    close: t(AppI18nKeys.CLOSE),
    shareCopyLink: t(ChatI18nKeys.SHARE_COPY_LINK),
    shareCopiedLink: t(ChatI18nKeys.SHARE_COPIED_LINK),
    shareDescription: t(ChatI18nKeys.SHARE_LINK_DESCRIPTION),
    shareRemoveAccessToUsers: t(ChatI18nKeys.SHARE_REMOVE_ACCESS_TO_USERS),
    chatExpiration: t(ChatI18nKeys.CHAT_EXPIRATION),
    chatExpirationDays: t(ChatI18nKeys.CHAT_EXPIRATION_DAYS),
    chatName: t(ChatI18nKeys.CHAT_NAME),
    chatWarning: t(ChatI18nKeys.CHAT_WARNING),
  };

  return (
    <aside
      className={classNames(
        'bg-neutrals-200 h-full flex flex-col justify-between min-w-0 relative',
        isCollapsed ? 'w-[64px]' : 'w-[362px]',
      )}
    >
      <div className="flex flex-col h-full">
        <div
          className={classNames(
            'flex flex-row items-center py-[14px]',
            isCollapsed ? 'px-[10px] justify-center' : 'px-6 justify-between',
          )}
        >
          <div
            className="flex flex-row items-center cursor-pointer"
            onClick={redirectToMainView}
          >
            <Logo width={34} height={34} />
            {!isCollapsed ? (
              <span className="text-hues-900 text-start logo ml-3">
                <p className="font-semibold mr-1 inline mb-1">
                  {t(I18nKeys.App.TITLE_GLOBAL)}
                </p>
                <p className="inline">{t(I18nKeys.App.TITLE)}</p>
              </span>
            ) : null}
          </div>

          {!isCollapsed ? (
            <i
              className="text-primary cursor-pointer"
              title={t(I18nKeys.App.COLLAPSE)}
              onClick={onToggleCollapse}
            >
              <Collapse width={20} height={20} />
            </i>
          ) : null}
        </div>
        <div
          className={classNames(
            'flex flex-col h-full pb-[14px] flex-1 min-h-0 pt-6',
            isCollapsed ? 'px-[10px]' : 'px-6',
          )}
        >
          <div className="flex flex-col gap-3">
            {isCollapsed && (
              <button
                className="flex self-center justify-center items-center text-primary size-9"
                title={t(I18nKeys.App.EXPAND)}
                onClick={onToggleCollapse}
              >
                <Expand width={20} height={20} />
              </button>
            )}

            <Button
              iconBefore={<IconPlus width={20} height={20} />}
              title={isCollapsed ? '' : t(I18nKeys.Nav.NEW_CHAT)}
              onClick={handleOpeningOfNewConversation}
              buttonClassName={classNames(
                'text-button-client',
                isCollapsed && 'p-2',
              )}
            />
          </div>

          <ConversationList
            handleConversationClick={handleConversationSelect}
            handleSelectedConversationRemove={handleSelectedConversationRemove}
            actions={actions}
            locale={locale}
            shareConversationProps={{
              ...SHARE_CONVERSATION_PROPS(authHandler),
              ...shareTitles,
              id,
            }}
            conversations={conversations}
            sharedConversations={sharedConversations}
            setConversations={setConversations}
            setSharedConversations={setSharedConversations}
            isCollapsed={isCollapsed}
            selectedConversationId={getConversationId(id, locale)}
            conversationStyles={{
              titles,
              isSmallModalButton: true,
              conversationItemIcon: (
                <i className="w-[20px] h-[20px] mr-4">
                  <MessageIcon width={20} height={20} />
                </i>
              ),
              actionsIcons: {
                [ActionMenuItem.DELETE]: <Delete width={16} height={16} />,
                [ActionMenuItem.SHARE]: <Share width={16} height={16} />,
                [ActionMenuItem.EXPORT]: <Export width={16} height={16} />,
                [ActionMenuItem.RENAME]: <Rename width={16} height={16} />,
              },
            }}
          />
        </div>
      </div>

      {session?.user && (
        <div
          className={classNames(
            'w-full bg-neutrals-200 flex items-center p-6 sm:p-4 sticky bottom-0',
            isCollapsed && '!p-0 !w-fit !self-center mb-6',
          )}
        >
          <div className="border border-neutrals-500 p-[7px] rounded-[100px] w-full flex">
            <User
              userInfo={session?.user as UserInfo}
              signOutAction={signOutAction}
              locale={locale}
              styles={{
                initialStyles: classNames(
                  'border-none bg-hues-800 text-white lg:h2 sm:body-2 border-accent-700 border-[1px]',
                  isCollapsed && '!size-10',
                ),
                signOutIcon: <SignOut />,
                userNameStyles: classNames(isCollapsed && 'hidden'),
                dropdownButtonStyles: 'hover:bg-hues-100 w-max',
              }}
              titles={signOutTitles}
            />
          </div>
        </div>
      )}
    </aside>
  );
};

export default ConversationListWrapper;
