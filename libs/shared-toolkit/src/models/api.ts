import {
  API_KEY_HEADER,
  CONTENT_TYPE_HEADER,
  X_CONVERSATION_ID_HEADER,
} from '@statgpt/shared-toolkit/src/constants/headers';

export interface ApiHeaders {
  Authorization?: string;
  [CONTENT_TYPE_HEADER]?: string;
  [API_KEY_HEADER]?: string;
  [X_CONVERSATION_ID_HEADER]?: string;
}
