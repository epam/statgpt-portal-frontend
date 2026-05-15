import { Attachment, Role } from '@epam/ai-dial-shared';
import { Message } from '@epam/statgpt-dial-toolkit';

/**
 * Replaces the python code-sample attachment in a message's attachment list.
 * When messageId is provided the matching message is targeted; otherwise the
 * latest system message is used (AdvancedView path, which has no id).
 * Returns the updated messages array, or null when the target message is not
 * found or is not a System message.
 */
export function replacePythonAttachment(
  messages: Message[],
  newAttachment: Attachment,
  messageId?: string,
): Message[] | null {
  let targetIndex = -1;
  if (messageId) {
    targetIndex = messages.findIndex((m) => m.id === messageId);
  } else {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === Role.System) {
        targetIndex = i;
        break;
      }
    }
  }

  if (targetIndex === -1 || messages[targetIndex].role !== Role.System)
    return null;

  const existingAttachments =
    messages[targetIndex].custom_content?.attachments ?? [];
  const updatedAttachments = [
    ...existingAttachments.filter(
      (a) => !(a.type === 'text/markdown' && a.data?.includes('```python')),
    ),
    newAttachment,
  ];

  return messages.map((m, i) =>
    i === targetIndex
      ? {
          ...m,
          custom_content: {
            ...m.custom_content,
            attachments: updatedAttachments,
          },
        }
      : m,
  );
}
