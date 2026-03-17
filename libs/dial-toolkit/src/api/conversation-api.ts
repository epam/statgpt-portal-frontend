/**
 * Conversation API - High-level conversation management interface
 *
 * Provides specialized API methods for conversation CRUD operations,
 * built on top of the DialApiClient. Handles conversation creation,
 * retrieval, updates, and deletion with proper type safety and
 * URL encoding for the AI DIAL backend.
 */

import { Conversation, Entity as DialEntity } from '@epam/ai-dial-shared';

import { Message } from '../models/message';
import { DialApiClient } from './dial-api-client';
import { isError } from '../utils/is-error';
import {
  generateConversationId,
  parseConversationName,
} from '../utils/parse-conversation-name';
import { encodeApiUrl } from '../utils/url';
import { DIAL_API_ROUTES } from '../constants/api-urls';
import { ConversationInfo } from '@epam/ai-dial-shared';
import {
  ConversationData,
  CreateConversationRequest,
  GeneratedLinkResponse,
  SharedConversationsRequest,
  SharedConversations,
  UpdateConversationRequest,
  SharedConversationInfo,
} from '../models/conversation';
import { ModelInfo } from '../models/model';
import { GridAttachmentContent } from '../models/grid-attachment';
import { CustomFields } from '../models/chat-stream';
import {
  getMultipartHeaders,
  OnboardingFileSchema,
} from '@epam/statgpt-shared-toolkit';

const CONVERSATION_URL = (id: string) =>
  `/v1/conversations/${encodeApiUrl(id)}`;

interface Entity extends DialEntity {
  url?: string;
  parentPath: string;
}
export class ConversationApi {
  constructor(private client: DialApiClient) {}

  async getConversations(
    token: string,
    bucket?: string,
    locale?: string,
  ): Promise<ConversationInfo[]> {
    const folderId = `${bucket ? (locale ? `${bucket}/${locale}` : `${bucket}`) : ''}`;
    const endpoint = `${DIAL_API_ROUTES.CONVERSATIONS}/${folderId}`;

    try {
      const response = await this.client
        .getRequest<{
          items: Entity[];
        }>(endpoint + '/?limit=1000&recursive=false', token)
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

  async getConversation(
    id: string,
    token: string,
  ): Promise<Conversation | null> {
    try {
      return await this.client.getRequest<Conversation>(
        CONVERSATION_URL(id),
        token,
      );
    } catch (error) {
      if (isError(error)) {
        return null;
      }
      throw error;
    }
  }

  async getFile(
    filePath: string,
    token: string,
  ): Promise<GridAttachmentContent | null> {
    try {
      const endpoint = `${DIAL_API_ROUTES.VERSION}/${encodeApiUrl(filePath)}`;
      return await this.client.getRequest(endpoint, token);
    } catch (error) {
      if (isError(error)) {
        return null;
      }
      throw error;
    }
  }

  async putOnboardingFile(
    fileName: string,
    filePath: string,
    fileData: OnboardingFileSchema,
    token: string,
  ): Promise<Entity | null> {
    try {
      const endpoint = `${DIAL_API_ROUTES.VERSION}/${encodeApiUrl(filePath)}`;

      const boundary = '----NodeMultipartBoundary';

      const bodyParts = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
        `Content-Type: application/json`,
        '',
        JSON.stringify(fileData),
        `--${boundary}--`,
        '',
      ];
      const body = bodyParts.join('\r\n');

      return await this.client.request(endpoint, token, {
        method: 'PUT',
        body,
        headers: getMultipartHeaders(boundary),
        isFormData: true,
      });
    } catch (error) {
      if (isError(error)) {
        return null;
      }
      throw error;
    }
  }

  async getOnboardingFile(
    filePath: string,
    token: string,
  ): Promise<OnboardingFileSchema | null> {
    try {
      const endpoint = `${DIAL_API_ROUTES.VERSION}/${encodeApiUrl(filePath)}`;
      return await this.client.getRequest(endpoint, token);
    } catch (error) {
      if (isError(error)) {
        return null;
      }
      throw error;
    }
  }

  async getFileBlob(filePath: string, token: string): Promise<Blob | null> {
    try {
      const endpoint = `${DIAL_API_ROUTES.VERSION}/${encodeApiUrl(filePath)}`;
      return await this.client.requestBlob(endpoint, token, { method: 'GET' });
    } catch (error) {
      if (isError(error)) {
        return null;
      }
      throw error;
    }
  }

  async deleteFile(filePath: string, token: string): Promise<void> {
    try {
      const endpoint = `${DIAL_API_ROUTES.VERSION}/${encodeApiUrl(filePath)}`;
      await this.client.request(endpoint, token, { method: 'DELETE' });
    } catch (error) {
      if (isError(error)) {
        return;
      }
      throw error;
    }
  }

  async createConversation(
    data: CreateConversationRequest,
    token: string,
  ): Promise<ConversationInfo> {
    const conversationId = data?.id || generateConversationId(data);
    const { name, folderId, model, messages, custom_fields } = data;

    const conversationData = {
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
      custom_fields,
    };

    await this.client.request<ConversationInfo>(
      CONVERSATION_URL(conversationId),
      token,
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
    token: string,
    conversationData?: ConversationData,
  ): Promise<GeneratedLinkResponse> {
    return await this.client.postRequest<GeneratedLinkResponse>(
      DIAL_API_ROUTES.SHARE_CONVERSATION,
      token,
      {
        body: conversationData,
      },
    );
  }

  async getSharedConversations(
    token: string,
    requestData?: SharedConversationsRequest,
  ): Promise<SharedConversations> {
    return await this.client.postRequest<SharedConversations>(
      DIAL_API_ROUTES.SHARE_CONVERSATION_LIST,
      token,
      {
        body: requestData,
      },
    );
  }

  async revokeSharedConversations(
    token: string,
    sharedConversations?: SharedConversations,
  ): Promise<void> {
    await this.client.postRequest(
      DIAL_API_ROUTES.SHARE_CONVERSATION_REVOKE,
      token,
      {
        body: sharedConversations,
      },
    );
  }

  async updateConversation(
    id: string,
    data: UpdateConversationRequest,
    token: string,
  ): Promise<ConversationInfo> {
    const existingConversation = await this.getConversation(id, token);
    if (!existingConversation) {
      throw new Error(`Conversation with id ${id} not found`);
    }

    const updatedConversation: Conversation = {
      ...existingConversation,
      ...data,
      updatedAt: Date.now(),
    };

    return await this.client.request<ConversationInfo>(
      CONVERSATION_URL(id),
      token,
      {
        method: 'PUT',
        body: updatedConversation,
      },
    );
  }

  async deleteConversation(
    id: string,
    conversation: ConversationInfo,
    token: string,
  ): Promise<void> {
    if (conversation?.isShared) {
      await this.client.postRequest(
        DIAL_API_ROUTES.SHARE_CONVERSATION_DISCARD,
        token,
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
      await this.client.request(CONVERSATION_URL(decodeURI(id)), token, {
        method: 'DELETE',
      });
    }
  }

  async streamChat(
    params: {
      conversationId: string;
      messages: Message[];
      model: ModelInfo;
      custom_fields?: CustomFields;
    },
    token: string,
  ): Promise<ReadableStream> {
    const modelId = params.model.id;
    const encodedModelId = encodeURIComponent(modelId);
    const endpoint = `${DIAL_API_ROUTES.CHAT(encodedModelId)}?api-version=${this.client.config.version}`;

    const body = {
      messages: params.messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
      custom_fields: params.custom_fields,
    };

    return await this.client.stream(endpoint, token, {
      method: 'POST',
      body,
      chatReference: params.conversationId,
    });
  }

  async rateResponse(
    deploymentId: string,
    responseId: string,
    rate: boolean,
    token: string,
  ): Promise<void> {
    return await this.client.postRequest(
      DIAL_API_ROUTES.RATE(deploymentId),
      token,
      {
        body: {
          responseId,
          rate,
        },
      },
    );
  }

  async renameConversation(
    sourceUrl: string,
    destinationUrl: string,
    token: string,
  ): Promise<void> {
    return await this.client.postRequest(DIAL_API_ROUTES.RENAME, token, {
      body: {
        sourceUrl,
        destinationUrl,
        overwrite: true,
      },
    });
  }
}
