import {
  ConversationData,
  GeneratedLinkResponse,
} from '@epam/statgpt-dial-toolkit';

const SHARE_API_ENDPOINT = '/api/share';

export async function generateConversationLinkApi(
  conversationData?: ConversationData,
): Promise<GeneratedLinkResponse> {
  const response = await fetch(SHARE_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(conversationData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to generate conversation link: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`,
    );
  }

  return response.json();
}
