import {
  API_KEY_HEADER,
  CONTENT_TYPE_HEADER,
  OCP_APIM_SUBSCRIPTION_KEY_HEADER,
  X_CONVERSATION_ID_HEADER,
} from '../constants/headers';

export interface ApiHeaders {
  Authorization?: string;
  [OCP_APIM_SUBSCRIPTION_KEY_HEADER]?: string;
  [CONTENT_TYPE_HEADER]?: string;
  [API_KEY_HEADER]?: string;
  [X_CONVERSATION_ID_HEADER]?: string;
}
