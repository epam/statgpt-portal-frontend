import { invokePythonAttachment } from '../python-attachment';

jest.mock('@epam/statgpt-dial-toolkit', () => ({
  AttachmentType: {
    CUSTOM_CODE_SAMPLE: 'custom_code_sample',
    MARKDOWN: 'text/markdown',
  },
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('invokePythonAttachment', () => {
  it('forwards datasetUrn as the second argument of onCodeAttachmentUpdated', async () => {
    const getPythonAttachment = jest
      .fn()
      .mockResolvedValue({ python_code: 'x = 1' });
    const setCodeAttachments = jest.fn();
    const onCodeAttachmentUpdated = jest.fn();

    invokePythonAttachment({
      getPythonAttachment,
      dataQueries: [{ urn: 'URN:B' } as any],
      requestIdRef: { current: 0 },
      codeTitle: 'Code',
      markdownTitle: 'Python code for URN:B',
      setCodeAttachments,
      onCodeAttachmentUpdated,
      datasetUrn: 'URN:B',
    });

    await flush();

    expect(onCodeAttachmentUpdated).toHaveBeenCalledTimes(1);
    expect(onCodeAttachmentUpdated.mock.calls[0][1]).toBe('URN:B');
  });

  it('passes undefined datasetUrn through when not provided', async () => {
    const getPythonAttachment = jest
      .fn()
      .mockResolvedValue({ python_code: 'x = 1' });
    const onCodeAttachmentUpdated = jest.fn();

    invokePythonAttachment({
      getPythonAttachment,
      dataQueries: [{ urn: 'URN:B' } as any],
      requestIdRef: { current: 0 },
      codeTitle: 'Code',
      markdownTitle: 'Python Code',
      setCodeAttachments: jest.fn(),
      onCodeAttachmentUpdated,
    });

    await flush();

    expect(onCodeAttachmentUpdated.mock.calls[0][1]).toBeUndefined();
  });
});
