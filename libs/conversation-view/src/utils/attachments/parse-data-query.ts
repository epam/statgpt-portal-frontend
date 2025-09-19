import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { isJsonAttachment } from './attachment-parser';
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

  return jsonAttachments?.map((json) => ({
    title: json?.title,
    ...extractJsonFromAttachment(json?.data),
  }));
}

function extractJsonFromAttachment(mdContent?: string) {
  if (mdContent) {
    try {
      return JSON.parse(mdContent);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  }
  return null;
}
