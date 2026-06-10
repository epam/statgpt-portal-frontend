import {
  invokePythonAttachment,
  resolveSingleDatasetPythonTitle,
} from '../python-attachment';

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

describe('resolveSingleDatasetPythonTitle', () => {
  const pythonAttachment = (title: string) => ({
    type: 'text/markdown',
    title,
    data: '```python\nx = 1\n```',
  });

  it('returns the existing python attachment title whose title includes the dataset urn', () => {
    const rawAttachments = [
      pythonAttachment('Python Code: IMF.STA:NSDP(7.0.0)'),
      pythonAttachment('Python Code: IMF.STA:ANEA(6.0.1)'),
    ] as any;

    const title = resolveSingleDatasetPythonTitle(rawAttachments, {
      urn: 'IMF.STA:ANEA(6.0.1)',
    } as any);

    expect(title).toBe('Python Code: IMF.STA:ANEA(6.0.1)');
  });

  it('falls back to the dataset urn when no python attachment matches the urn', () => {
    const rawAttachments = [
      pythonAttachment('Python Code: IMF.STA:NSDP(7.0.0)'),
    ] as any;

    const title = resolveSingleDatasetPythonTitle(rawAttachments, {
      urn: 'IMF.STA:ANEA(6.0.1)',
    } as any);

    expect(title).toBe('IMF.STA:ANEA(6.0.1)');
  });

  it('ignores non-markdown and non-python attachments', () => {
    const rawAttachments = [
      {
        type: 'application/json',
        title: 'Query: IMF.STA:ANEA(6.0.1)',
        data: '{}',
      },
      {
        type: 'text/markdown',
        title: 'Notes: IMF.STA:ANEA(6.0.1)',
        data: 'no code here',
      },
    ] as any;

    const title = resolveSingleDatasetPythonTitle(rawAttachments, {
      urn: 'IMF.STA:ANEA(6.0.1)',
    } as any);

    expect(title).toBe('IMF.STA:ANEA(6.0.1)');
  });

  it('falls back to the dataset urn when there are no attachments', () => {
    expect(
      resolveSingleDatasetPythonTitle(undefined, {
        urn: 'IMF.STA:ANEA(6.0.1)',
      } as any),
    ).toBe('IMF.STA:ANEA(6.0.1)');
  });
});
