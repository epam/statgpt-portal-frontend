import {
  prepareSystemMessage,
  updateMessagesWithSystemMessage,
} from '../system-message';
import { getLastAssistantMessage } from '../messages';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

jest.mock('@epam/ai-dial-shared', () => ({
  Role: { System: 'system' },
}));
jest.mock('@epam/statgpt-dial-toolkit', () => ({
  AttachmentType: { JSON: 'application/json' },
}));
jest.mock('../messages', () => ({
  getLastAssistantMessage: jest.fn().mockReturnValue(undefined),
}));

beforeEach(() => {
  (getLastAssistantMessage as jest.Mock).mockReturnValue(undefined);
});

const SYSTEM_MESSAGE = (attachments: any[] = []) => ({
  role: 'system',
  content: '',
  custom_content: { attachments },
});

const PYTHON_ATTACHMENT = {
  type: 'text/markdown',
  data: '```python\nprint("hello")\n```',
};

const BASE_METADATA = {
  countryDimension: 'REF_AREA',
  indicatorDimensions: ['INDICATOR'],
};

describe('prepareSystemMessage', () => {
  describe('disabled serialization', () => {
    it('includes disabled:true in attachment JSON when DataQuery.disabled is true', () => {
      const dataQueries: DataQuery[] = [
        { urn: 'TEST:DS(1.0)', disabled: true, metadata: BASE_METADATA },
      ];

      const message = prepareSystemMessage(undefined, undefined, dataQueries);
      const data = JSON.parse(
        (message.custom_content!.attachments![0] as any).data,
      );

      expect(data.disabled).toBe(true);
    });

    it('includes disabled:false in attachment JSON when DataQuery.disabled is not set', () => {
      const dataQueries: DataQuery[] = [
        { urn: 'TEST:DS(1.0)', metadata: BASE_METADATA },
      ];

      const message = prepareSystemMessage(undefined, undefined, dataQueries);
      const data = JSON.parse(
        (message.custom_content!.attachments![0] as any).data,
      );

      expect(data.disabled).toBe(false);
    });
  });
});

describe('updateMessagesWithSystemMessage', () => {
  const DATA_QUERIES: DataQuery[] = [
    { urn: 'TEST:DS(1.0)', metadata: BASE_METADATA },
  ];

  it('does not mutate the original messages array', () => {
    const messages = [SYSTEM_MESSAGE()];
    const original = [...messages];
    updateMessagesWithSystemMessage(messages, DATA_QUERIES);
    expect(messages).toEqual(original);
  });

  it('replaces the last system message with a new one', () => {
    const messages = [SYSTEM_MESSAGE()];
    const result = updateMessagesWithSystemMessage(messages, DATA_QUERIES);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('system');
    expect(result[0]).not.toBe(messages[0]);
  });

  it('carries a Python attachment from the old system message to the new one', () => {
    const messages = [SYSTEM_MESSAGE([PYTHON_ATTACHMENT])];
    const result = updateMessagesWithSystemMessage(messages, DATA_QUERIES);
    const attachments = result[0].custom_content!.attachments!;
    const python = attachments.find(
      (a: any) => a.type === 'text/markdown' && a.data?.includes('```python'),
    );
    expect(python).toBeDefined();
    expect(python?.data).toBe(PYTHON_ATTACHMENT.data);
  });

  it('does not add a Python attachment when the old system message had none', () => {
    const messages = [SYSTEM_MESSAGE()];
    const result = updateMessagesWithSystemMessage(messages, DATA_QUERIES);
    const attachments = result[0].custom_content!.attachments!;
    const python = attachments.find((a: any) => a.type === 'text/markdown');
    expect(python).toBeUndefined();
  });

  it('appends a new system message when there is no existing one', () => {
    const assistantMessage = { role: 'assistant', content: 'hi' };
    const result = updateMessagesWithSystemMessage(
      [assistantMessage] as any,
      DATA_QUERIES,
    );
    expect(result).toHaveLength(2);
    expect(result[1].role).toBe('system');
  });

  it('returns empty array when messages is falsy', () => {
    const result = updateMessagesWithSystemMessage(null as any, DATA_QUERIES);
    expect(result).toEqual([]);
  });

  it('carries ALL python attachments from the old system message to the new one', () => {
    const pythonA = {
      type: 'text/markdown',
      title: 'Python code for TEST:DS(1.0)',
      data: '```python\nprint("A")\n```',
    };
    const pythonB = {
      type: 'text/markdown',
      title: 'Python code for TEST:DS2(1.0)',
      data: '```python\nprint("B")\n```',
    };
    const messages = [SYSTEM_MESSAGE([pythonA, pythonB])];

    const result = updateMessagesWithSystemMessage(messages, DATA_QUERIES);
    const attachments = result[0].custom_content!.attachments!;
    const pythonAttachments = attachments.filter(
      (a: any) => a.type === 'text/markdown' && a.data?.includes('```python'),
    );

    expect(pythonAttachments).toHaveLength(2);
    expect(pythonAttachments.map((a: any) => a.data)).toEqual([
      pythonA.data,
      pythonB.data,
    ]);
  });

  it('seeds python attachments from the assistant message when there is no prior system message', () => {
    const pyA = {
      type: 'text/markdown',
      title: 'Python Code: A',
      data: '```python\nA\n```',
    };
    const pyB = {
      type: 'text/markdown',
      title: 'Python Code: B',
      data: '```python\nB\n```',
    };
    const assistant = {
      role: 'assistant',
      content: '',
      custom_content: { attachments: [pyA, pyB] },
    };
    (getLastAssistantMessage as jest.Mock).mockReturnValue(assistant);

    const result = updateMessagesWithSystemMessage(
      [assistant] as any,
      DATA_QUERIES,
    );
    const sys = result[result.length - 1];
    const python = sys.custom_content!.attachments!.filter(
      (a: any) => a.type === 'text/markdown' && a.data?.includes('```python'),
    );

    expect(python.map((a: any) => a.title)).toEqual([
      'Python Code: A',
      'Python Code: B',
    ]);
  });

  it('unions assistant originals with updated system python, preferring updated versions by title', () => {
    const pyA = {
      type: 'text/markdown',
      title: 'Python Code: A',
      data: '```python\nA\n```',
    };
    const pyBOld = {
      type: 'text/markdown',
      title: 'Python Code: B',
      data: '```python\nB-old\n```',
    };
    const pyC = {
      type: 'text/markdown',
      title: 'Python Code: C',
      data: '```python\nC\n```',
    };
    const assistant = {
      role: 'assistant',
      content: '',
      custom_content: { attachments: [pyA, pyBOld, pyC] },
    };
    const pyBUpdated = {
      type: 'text/markdown',
      title: 'Python Code: B',
      data: '```python\nB-new\n```',
    };
    const degradedSystem = SYSTEM_MESSAGE([pyBUpdated]);
    (getLastAssistantMessage as jest.Mock).mockReturnValue(assistant);

    const result = updateMessagesWithSystemMessage(
      [assistant, degradedSystem] as any,
      DATA_QUERIES,
    );
    const sys = result[result.length - 1];
    const python = sys.custom_content!.attachments!.filter(
      (a: any) => a.type === 'text/markdown' && a.data?.includes('```python'),
    );

    expect(python).toHaveLength(3);
    expect(
      python.find((a: any) => a.title === 'Python Code: B')?.data,
    ).toContain('B-new');
  });
});
