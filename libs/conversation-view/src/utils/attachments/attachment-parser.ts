import { Attachment } from '@epam/ai-dial-shared';
import { AttachmentType, Message } from '@epam/statgpt-dial-toolkit';

export const parseMessageAttachments = (message: Message): Attachment[] => {
  const attachments: Attachment[] = [];
  if (message.custom_content?.attachments) {
    attachments.push(...message.custom_content.attachments);
  }
  return attachments;
};

export function isUrlAttachment(attachment: Attachment): boolean {
  return (
    attachment.type === AttachmentType.MARKDOWN &&
    attachment.title != null &&
    attachment.title?.startsWith('URL Query')
  );
}

export function isJsonAttachment(attachment: Attachment): boolean {
  return (
    attachment.type === AttachmentType.JSON &&
    attachment.title != null &&
    attachment.title?.startsWith('Query (JSON)')
  );
}

export function isMarkdownAttachment(attachment: Attachment): boolean {
  return (
    attachment.type === AttachmentType.MARKDOWN && !isUrlAttachment(attachment)
  );
}

export function isFileAttachment(attachment: Attachment): boolean {
  return attachment.type === AttachmentType.CSV;
}

export function isGridAttachment(attachment: Attachment): boolean {
  return attachment.type === AttachmentType.TABLE;
}

export function isCustomGridAttachment(attachment: Attachment): boolean {
  return attachment.type === AttachmentType.CUSTOM_DATA_GRID;
}

export function isCustomChartAttachment(attachment: Attachment): boolean {
  return attachment.type === AttachmentType.CUSTOM_CHART;
}

export function isChartAttachment(attachment: Attachment): boolean {
  return attachment.type === AttachmentType.PLOTLY;
}

export function isCustomCodeSampleAttachment(attachment: Attachment): boolean {
  return attachment.type === AttachmentType.CUSTOM_CODE_SAMPLE;
}

export function isCrossDatasetGrid(attachment: Attachment): boolean {
  return attachment.type === AttachmentType.CROSS_DATASET_GRID;
}
