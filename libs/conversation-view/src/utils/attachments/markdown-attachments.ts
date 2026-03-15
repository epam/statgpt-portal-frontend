import { Attachment } from '@epam/ai-dial-shared';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import { CustomCodeAttachment } from '../../models/attachments';
import { unwrapMarkdownCode } from './unwrap-markdown-code';

const ALLOWED_CODE_SAMPLE_LANGUAGES = ['python'];

export function buildMarkdownAttachments(
  rawAttachments: Attachment[],
  urn: string | undefined,
  codeSamplesTitle?: string,
): CustomCodeAttachment[] {
  return rawAttachments
    .filter((a) => a.type === AttachmentType.MARKDOWN)
    .filter((a) => !urn || a.title?.includes(urn))
    .map((a) => {
      const parsed = unwrapMarkdownCode(a.data ?? '');
      return {
        title: codeSamplesTitle ?? 'Code samples',
        type: AttachmentType.CUSTOM_CODE_SAMPLE,
        language: parsed.language,
        data: parsed.code,
      } as CustomCodeAttachment;
    })
    .filter((a) =>
      ALLOWED_CODE_SAMPLE_LANGUAGES.includes(a.language ?? ''),
    );
}
