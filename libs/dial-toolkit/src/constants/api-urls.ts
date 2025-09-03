/**
 * DIAL API endpoint constants
 */
const VERSION = 'v1';

export const DIAL_API_ROUTES = {
  VERSION: `/${VERSION}`,
  BUCKET: `/${VERSION}/bucket`,
  CONVERSATIONS: `/${VERSION}/metadata/conversations`,
  CONVERSATION_BY_ID: (id: string) =>
    `/${VERSION}/metadata/conversations/${id}`,
  CHAT: (modelId: string) => `/openai/deployments/${modelId}/chat/completions`,
  MODELS: '/openai/models',
  CONFIGURATION: (modelId: string) =>
    `/${VERSION}/deployments/${modelId}/configuration`,
  SHARE_CONVERSATION: `/${VERSION}/ops/resource/share/create`,
} as const;
