/**
 * DIAL API endpoint constants
 */
const VERSION = 'v1';

const SHARE_RESOURCE = `/${VERSION}/ops/resource/share`;

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
  SHARE_CONVERSATION: `${SHARE_RESOURCE}/create`,
  SHARE_CONVERSATION_ACCEPT: (invitationId: string) =>
    `/${VERSION}/invitations/${invitationId}?accept=true`,
  SHARE_CONVERSATION_DETAILS: (invitationId: string) =>
    `/${VERSION}/invitations/${invitationId}`,
  SHARE_CONVERSATION_LIST: `${SHARE_RESOURCE}/list`,
  SHARE_CONVERSATION_DISCARD: `${SHARE_RESOURCE}/discard`,
  SHARE_CONVERSATION_REVOKE: `${SHARE_RESOURCE}/revoke`,
} as const;
