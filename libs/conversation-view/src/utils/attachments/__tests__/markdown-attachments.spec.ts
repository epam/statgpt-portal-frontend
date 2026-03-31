import { Attachment } from '@epam/ai-dial-shared';
import { buildMarkdownAttachments } from '../markdown-attachments';

jest.mock('@epam/statgpt-dial-toolkit', () => ({
  AttachmentType: {
    MARKDOWN: 'text/markdown',
    CUSTOM_CODE_SAMPLE: 'custom_code_sample',
  },
}));

// Import after mock so the enum values are the mocked ones
import { AttachmentType } from '@epam/statgpt-dial-toolkit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const markdown = (
  data: string,
  title = 'Code samples',
  extras: Partial<Attachment> = {},
): Attachment =>
  ({ type: AttachmentType.MARKDOWN, title, data, ...extras }) as Attachment;

// ---------------------------------------------------------------------------
// buildMarkdownAttachments
// ---------------------------------------------------------------------------

describe('buildMarkdownAttachments', () => {
  const PYTHON_CODE = '```python\nprint("hello")\n```';

  it('returns a CUSTOM_CODE_SAMPLE attachment for a fenced python block', () => {
    const result = buildMarkdownAttachments([markdown(PYTHON_CODE)], undefined);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(AttachmentType.CUSTOM_CODE_SAMPLE);
    expect(result[0].language).toBe('python');
    expect(result[0].data).toBe('print("hello")');
  });

  it('uses "Code samples" as the default title when none is provided', () => {
    const result = buildMarkdownAttachments([markdown(PYTHON_CODE)], undefined);

    expect(result[0].title).toBe('Code samples');
  });

  it('uses the provided codeSamplesTitle when given', () => {
    const result = buildMarkdownAttachments(
      [markdown(PYTHON_CODE)],
      undefined,
      'My scripts',
    );

    expect(result[0].title).toBe('My scripts');
  });

  it('returns an empty array for an empty input', () => {
    expect(buildMarkdownAttachments([], undefined)).toEqual([]);
  });

  it('filters out attachments that are not MARKDOWN type', () => {
    const nonMarkdown = {
      type: AttachmentType.JSON,
      title: 'query',
      data: PYTHON_CODE,
    } as unknown as Attachment;

    expect(buildMarkdownAttachments([nonMarkdown], undefined)).toEqual([]);
  });

  it('filters out non-python code blocks', () => {
    const jsCode = markdown('```javascript\nconsole.log("hi");\n```');

    expect(buildMarkdownAttachments([jsCode], undefined)).toEqual([]);
  });

  it('filters out attachments whose title does not include the urn', () => {
    const urn = 'DF:ESTAT:DATASET:1.0';
    const unrelated = markdown(PYTHON_CODE, 'unrelated title');

    expect(buildMarkdownAttachments([unrelated], urn)).toEqual([]);
  });

  it('keeps attachments whose title includes the urn', () => {
    const urn = 'DF:ESTAT:DATASET:1.0';
    const matching = markdown(PYTHON_CODE, `Python code for ${urn}`);

    const result = buildMarkdownAttachments([matching], urn);

    expect(result).toHaveLength(1);
  });

  it('passes all MARKDOWN attachments when urn is undefined', () => {
    const a1 = markdown(PYTHON_CODE, 'Dataset A');
    const a2 = markdown('```python\nx = 1\n```', 'Dataset B');

    const result = buildMarkdownAttachments([a1, a2], undefined);

    expect(result).toHaveLength(2);
  });

  it('handles missing data by treating it as an empty string', () => {
    const noData = markdown('```python\n```');

    const result = buildMarkdownAttachments([noData], undefined);

    expect(result).toHaveLength(1);
    expect(result[0].data).toBe('');
  });

  it('processes only matching attachments when the list is mixed', () => {
    const urn = 'DF:MY:DS:1.0';
    const matchingPython = markdown(PYTHON_CODE, `code for ${urn}`);
    const nonMatchingPython = markdown(PYTHON_CODE, 'other dataset');
    const jsAttachment = markdown('```javascript\n1+1\n```', `code for ${urn}`);
    const nonMarkdown = {
      type: 'application/json',
      title: `code for ${urn}`,
      data: PYTHON_CODE,
    } as unknown as Attachment;

    const result = buildMarkdownAttachments(
      [matchingPython, nonMatchingPython, jsAttachment, nonMarkdown],
      urn,
    );

    expect(result).toHaveLength(1);
    expect(result[0].language).toBe('python');
  });

  it('strips markdown fences and preserves multi-line code', () => {
    const multiLine = markdown(
      '```python\nimport os\n\nprint(os.getcwd())\n```',
    );

    const result = buildMarkdownAttachments([multiLine], undefined);

    expect(result[0].data).toBe('import os\n\nprint(os.getcwd())');
  });
});
