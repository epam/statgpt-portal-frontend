import { Message as DialMessage } from '@epam/ai-dial-shared';

export interface Message extends DialMessage {
  id?: string;
  timestamp?: number;
}
