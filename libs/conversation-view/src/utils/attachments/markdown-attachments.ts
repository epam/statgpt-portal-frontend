import { Attachment } from '@epam/ai-dial-shared';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import { CustomCodeAttachment } from '../../models/attachments';
import { unwrapMarkdownCode } from './unwrap-markdown-code';

const ALLOWED_CODE_SAMPLE_LANGUAGES = ['python'];

/**
 * Filters and transforms raw MARKDOWN-typed attachments into synthetic
 * `CUSTOM_CODE_SAMPLE` attachments containing unwrapped Python code.
 *
 * Only attachments whose language resolves to `python` after fence-stripping
 * are included. When `urn` is provided, attachments are further scoped to
 * those whose title contains the dataset URN.
 *
 * @param rawAttachments - Full list of raw attachments from the message response.
 * @param urn - Dataset URN used to scope attachments by title; pass `undefined` to include all markdown attachments.
 * @param codeSamplesTitle - Display title for the generated attachments; defaults to `"Code samples"`.
 */
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
    .filter((a) => ALLOWED_CODE_SAMPLE_LANGUAGES.includes(a.language ?? ''));
}
