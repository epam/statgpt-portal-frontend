import { DialApiClient } from './api/dial-api-client';
import { ConversationApi } from './api/conversation-api';

// Initialize the client with environment variables
const config = {
  host: process.env.DIAL_API_URL || '',
  version: process.env.DIAL_API_VERSION || '2025-01-01-preview',
  apiKey: process.env.DIAL_API_KEY || '',
};

export const dialApiClient = new DialApiClient(config);
export const conversationApi = new ConversationApi(dialApiClient);

export * from './constants/api-urls';
export * from './models';
export * from './types';
export * from './utils';
