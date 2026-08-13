import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationInfo, Conversation } from '@epam/ai-dial-shared';
import {
  ApiResponse,
  getConversationIdFromResourceUrl,
} from '@epam/statgpt-shared-toolkit';
import {
  SharedConversationsRequest,
  SharedConversations,
} from '@epam/statgpt-dial-toolkit';
import { getFileBlobApi } from '../../app/api/files/client';
import {
  getConversationsApi,
  getConversationApi,
} from '../../app/api/conversations/client';
import { getSharedConversationsApi } from '../../app/api/share/client';
import { ApplicationRoute } from '../../types/application-routes';
import { getSignInLink } from '../../constants/auth';
import {
  AuthHandler,
  wrapWithAuthHandler,
} from '../../utils/auth/requests-wrapper';
import { renameConversationAndSyncContent as renameConversationAndSyncContentFlow } from '../../utils/conversation/rename-conversation-and-sync-content';
import { deleteConversationAndAttachments } from '../../utils/conversation/delete-conversation-and-attachments';

export interface ConversationListActionsShape {
  getConversations: (locale: string) => Promise<ConversationInfo[]>;
  getSharedConversations: (
    requestData?: SharedConversationsRequest,
  ) => Promise<SharedConversations>;
  deleteConversation: (conversation: ConversationInfo) => Promise<void>;
  getConversation: (conversationId: string) => Promise<Conversation>;
  getFileBlob: (path: string) => Promise<Blob>;
  renameConversation: (
    conversationId: string,
    updatedId: string,
  ) => Promise<unknown>;
}

export interface UseConversationListActionsResult {
  actions: ConversationListActionsShape;
  authHandler: AuthHandler;
}

export function useConversationListActions(
  selectedConversationId: string | undefined,
  locale: string,
): UseConversationListActionsResult {
  const router = useRouter();

  const selectedConversationIdRef = useRef(selectedConversationId);
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const authHandler: AuthHandler = useCallback(
    <Args extends any[], T>(
      action: (...args: Args) => Promise<ApiResponse<T>>,
    ): ((...args: Args) => Promise<T>) => {
      return wrapWithAuthHandler(action, () => {
        router.push(getSignInLink(window.location.href));
      });
    },
    [router],
  );

  const getConversations = useMemo(
    () => authHandler(getConversationsApi),
    [authHandler],
  );
  const getSharedConversations = useMemo(
    () => authHandler(getSharedConversationsApi),
    [authHandler],
  );
  const deleteConversation = useMemo(
    () => authHandler(deleteConversationAndAttachments),
    [authHandler],
  );
  const getConversation = useMemo(
    () => authHandler(getConversationApi),
    [authHandler],
  );
  const getFileBlob = useMemo(() => authHandler(getFileBlobApi), [authHandler]);

  const renameConversation = useMemo(
    () =>
      authHandler(
        async (
          sourceUrl: string,
          destinationUrl: string,
        ): Promise<ApiResponse<void | ConversationInfo>> => {
          const { navPath, response } =
            await renameConversationAndSyncContentFlow(
              sourceUrl,
              destinationUrl,
            );
          const sourceConversationId =
            getConversationIdFromResourceUrl(sourceUrl);

          if (
            response.success &&
            navPath &&
            sourceConversationId === selectedConversationIdRef.current
          ) {
            router.replace(
              `/${locale}${ApplicationRoute.Conversations}/${navPath}`,
            );
          }

          return response;
        },
      ),
    [authHandler, locale, router],
  );

  const actions = useMemo<ConversationListActionsShape>(
    () => ({
      getConversations,
      getSharedConversations,
      deleteConversation,
      getConversation,
      getFileBlob,
      renameConversation,
    }),
    [
      getConversations,
      getSharedConversations,
      deleteConversation,
      getConversation,
      getFileBlob,
      renameConversation,
    ],
  );

  return { actions, authHandler };
}
