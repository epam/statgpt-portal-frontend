import { Role } from '@epam/ai-dial-shared';
import { generateConversationId } from '@epam/statgpt-dial-toolkit';

export const generateOnboardingConversation = (
  bucket: string,
  locale: string,
  name: string,
  assistantMessageContent: string,
  prompt?: string,
  choiceId?: string,
) => {
  const folderId = `${bucket}/${locale}`;

  return {
    name,
    folderId,
    prompt,
    id: generateConversationId({ folderId, name }),
    messages: [
      {
        role: Role.Assistant,
        content: assistantMessageContent,
      },
    ],
    custom_fields: {
      configuration: {
        choice: choiceId,
      },
    },
  };
};
