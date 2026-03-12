import { Conversation } from '@epam/ai-dial-shared';
import {
  CUSTOM_VIEW_STATE_KEY,
  CustomViewState,
  ErrorContextBase,
} from '@epam/statgpt-dial-toolkit';

export const updateConversationErrorContext = (
  conversation: Conversation,
  errorContext?: ErrorContextBase,
): Conversation => {
  const currentCustomViewState = conversation.customViewState ?? {};
  const currentAppViewState =
    (currentCustomViewState[CUSTOM_VIEW_STATE_KEY] as
      | CustomViewState
      | undefined) ?? {};

  return {
    ...conversation,
    customViewState: {
      ...currentCustomViewState,
      [CUSTOM_VIEW_STATE_KEY]: {
        ...currentAppViewState,
        errorContext,
      } satisfies CustomViewState,
    },
  };
};
