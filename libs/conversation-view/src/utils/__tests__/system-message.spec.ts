import {
  prepareSystemMessage,
  updateMessagesWithSystemMessage,
} from '../system-message';
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
});
