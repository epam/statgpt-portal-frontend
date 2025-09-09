/**
 * Conversation API - High-level conversation management interface
 *
 * Provides specialized API methods for conversation CRUD operations,
 * built on top of the DialApiClient. Handles conversation creation,
 * retrieval, updates, and deletion with proper type safety and
 * URL encoding for the AI DIAL backend.
 */

import { Conversation, Entity as DialEntity } from '@epam/ai-dial-shared';

import { Message } from '@statgpt/dial-toolkit/src/models/message';
import { DialApiClient } from '@statgpt/dial-toolkit/src/api/dial-api-client';
import { isError } from '@statgpt/dial-toolkit/src/utils/is-error';
import {
  generateConversationId,
  parseConversationName,
} from '@statgpt/dial-toolkit/src/utils/parse-conversation-name';
import { encodeApiUrl } from '@statgpt/dial-toolkit/src/utils/url';
import { DIAL_API_ROUTES } from '@statgpt/dial-toolkit/src/constants/api-urls';
import { ConversationInfo } from '@epam/ai-dial-shared';
import {
  ConversationData,
  CreateConversationRequest,
  GeneratedLinkResponse,
  SharedConversationsRequest,
  SharedConversations,
  UpdateConversationRequest,
  SharedConversationInfo,
} from '@statgpt/dial-toolkit/src/models/conversation';
import { ModelInfo } from '@statgpt/dial-toolkit/src/models/model';
import { GridAttachmentContent } from '@statgpt/dial-toolkit/src/models/grid-attachment';

const CONVERSATION_URL = (id: string) =>
  `/v1/conversations/${encodeApiUrl(id)}`;

interface Entity extends DialEntity {
  url?: string;
  parentPath: string;
}
export class ConversationApi {
  constructor(private client: DialApiClient) {}

  async getConversations(
    bucket?: string,
    locale?: string,
  ): Promise<ConversationInfo[]> {
    const folderId = `${bucket ? (locale ? `${bucket}/${locale}` : `${bucket}`) : ''}`;
    const endpoint = `${DIAL_API_ROUTES.CONVERSATIONS}/${folderId}`;

    try {
      const response = await this.client
        .getRequest<{
          items: Entity[];
        }>(endpoint + '/?limit=1000&recursive=false')
        .then((res) => res.items || []);

      return response.map((item) => {
        const { conversationName, modelId } = parseConversationName(item);

        return {
          id: item.url?.replace('conversations/', '') || item.name,
          name: conversationName,
          folderId: folderId,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          model: { id: modelId, name: modelId },
        } as ConversationInfo;
      });
    } catch (error) {
      if (isError(error)) {
        return [];
      }
      throw error;
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      return await this.client.getRequest<Conversation>(CONVERSATION_URL(id));
    } catch (error) {
      if (isError(error)) {
        return null;
      }
      throw error;
    }
  }

  async getFile(filePath: string): Promise<GridAttachmentContent | null> {
    try {
      const endpoint = `${DIAL_API_ROUTES.VERSION}/${encodeApiUrl(filePath)}`;
      return await this.client.getRequest(endpoint);
    } catch (error) {
      if (isError(error)) {
        return null;
      }
      throw error;
    }
  }

  async getFileBlob(filePath: string): Promise<Blob | null> {
    try {
      const endpoint = `${DIAL_API_ROUTES.VERSION}/${encodeApiUrl(filePath)}`;
      return await this.client.requestBlob(endpoint, { method: 'GET' });
    } catch (error) {
      if (isError(error)) {
        return null;
      }
      throw error;
    }
  }

  async createConversation(
    data: CreateConversationRequest,
  ): Promise<ConversationInfo> {
    const conversationId = data?.id || generateConversationId(data);
    const { name, folderId, model, messages } = data;

    const conversationData: Conversation = {
      id: conversationId,
      name,
      folderId,
      model: model as ModelInfo,
      messages: messages || [],
      selectedAddons: data.selectedAddons || [],
      prompt: data.prompt || '',
      temperature: data.temperature || 0.7,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.client.request<ConversationInfo>(
      CONVERSATION_URL(conversationId),
      {
        method: 'PUT',
        body: conversationData,
      },
    );

    return {
      id: conversationId,
      name,
      folderId,
      model: model as ModelInfo,
      createdAt: conversationData.createdAt,
      updatedAt: conversationData.updatedAt,
    };
  }

  async generateConversationLink(
    conversationData?: ConversationData,
  ): Promise<GeneratedLinkResponse> {
    return await this.client.postRequest<GeneratedLinkResponse>(
      DIAL_API_ROUTES.SHARE_CONVERSATION,
      {
        body: conversationData,
      },
    );
  }

  async getSharedConversations(
    requestData?: SharedConversationsRequest,
  ): Promise<SharedConversations> {
    return await this.client.postRequest<SharedConversations>(
      DIAL_API_ROUTES.SHARE_CONVERSATION_LIST,
      {
        body: requestData,
      },
    );
  }

  async revokeSharedConversations(
    sharedConversations?: SharedConversations,
  ): Promise<void> {
    await this.client.postRequest(DIAL_API_ROUTES.SHARE_CONVERSATION_REVOKE, {
      body: sharedConversations,
    });
  }

  async updateConversation(
    id: string,
    data: UpdateConversationRequest,
  ): Promise<ConversationInfo> {
    const existingConversation = await this.getConversation(id);
    if (!existingConversation) {
      throw new Error(`Conversation with id ${id} not found`);
    }

    const updatedConversation: Conversation = {
      ...existingConversation,
      ...data,
      updatedAt: Date.now(),
    };

    return await this.client.request<ConversationInfo>(CONVERSATION_URL(id), {
      method: 'PUT',
      body: updatedConversation,
    });
  }

  async deleteConversation(conversation: ConversationInfo): Promise<void> {
    if (conversation?.isShared) {
      await this.client.postRequest(
        DIAL_API_ROUTES.SHARE_CONVERSATION_DISCARD,
        {
          body: {
            resources: [
              {
                url: (conversation as SharedConversationInfo)?.url,
              },
            ],
          },
        },
      );
    } else {
      await this.client.request(CONVERSATION_URL(decodeURI(conversation?.id)), {
        method: 'DELETE',
      });
    }
  }

  async streamChat(params: {
    conversationId: string;
    messages: Message[];
    model: ModelInfo;
  }): Promise<ReadableStream> {
    const modelId = params.model.id;
    const encodedModelId = encodeURIComponent(modelId);
    const endpoint = `${DIAL_API_ROUTES.CHAT(encodedModelId)}?api-version=${this.client.config.version}`;

    const body = {
      messages: params.messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    };

    return await this.client.stream(endpoint, {
      method: 'POST',
      body,
      chatReference: params.conversationId,
    });
  }
}
