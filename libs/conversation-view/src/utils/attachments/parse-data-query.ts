import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { isJsonAttachment } from '@statgpt/conversation-view/src/utils/attachments/attachment-parser';
import { Attachment } from '@epam/ai-dial-shared';

export function getDataQueries(
  attachments: Attachment[],
): DataQuery[] | undefined {
  const jsonAttachments = attachments?.filter((attachment) =>
    isJsonAttachment(attachment),
  );

  if (!jsonAttachments?.every((json) => !!json?.data)) {
    return void 0;
  }

  return jsonAttachments?.map((json) => extractJsonFromMarkdown(json?.data));
}

function extractJsonFromMarkdown(mdContent?: string) {
  const match = mdContent?.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  }
  return null;
}
