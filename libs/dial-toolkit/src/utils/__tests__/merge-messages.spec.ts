import { mergeMessages } from '../merge-messages';
import { Message } from '../../models/message';

// @epam/ai-dial-shared is an ESM-only package; mock it so babel-jest can
// process this test file without an "Unexpected token 'export'" error.
jest.mock('@epam/ai-dial-shared', () => ({
  Role: {
    Assistant: 'assistant',
    User: 'user',
    System: 'system',
  },
}));

// jsdom does not expose structuredClone; polyfill it for the test environment.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(val: T): T =>
    JSON.parse(JSON.stringify(val));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  role: 'user' as Message['role'],
  content: '',
  ...overrides,
});

// ---------------------------------------------------------------------------
// mergeMessages — basic field updates
// ---------------------------------------------------------------------------

describe('mergeMessages', () => {
  it('returns a clone of the source when newMessages is empty', () => {
    const source = makeMessage({ content: 'hello' });
    const result = mergeMessages(source, []);
    expect(result).toEqual(source);
    expect(result).not.toBe(source);
  });

  it('does not mutate the original source', () => {
    const source = makeMessage({ content: 'original' });
    mergeMessages(source, [{ content: ' extra' }]);
    expect(source.content).toBe('original');
  });

  it('updates role when provided in a partial message', () => {
    const source = makeMessage({ role: 'user' as Message['role'] });
    const result = mergeMessages(source, [
      { role: 'assistant' as Message['role'] },
    ]);
    expect(result.role).toBe('assistant');
  });

  it('updates errorMessage when provided', () => {
    const source = makeMessage();
    const result = mergeMessages(source, [
      { errorMessage: 'something went wrong' },
    ]);
    expect(result.errorMessage).toBe('something went wrong');
  });

  it('updates responseId when provided', () => {
    const source = makeMessage();
    const result = mergeMessages(source, [{ responseId: 'resp-123' }]);
    expect(result.responseId).toBe('resp-123');
  });

  it('applies multiple partial messages in order', () => {
    const source = makeMessage({ content: 'a' });
    const result = mergeMessages(source, [{ content: 'b' }, { content: 'c' }]);
    expect(result.content).toBe('abc');
  });
});

// ---------------------------------------------------------------------------
// mergeMessages — content accumulation
// ---------------------------------------------------------------------------

describe('mergeMessages — content accumulation', () => {
  it('appends content to empty source content', () => {
    const source = makeMessage({ content: '' });
    const result = mergeMessages(source, [{ content: 'hello' }]);
    expect(result.content).toBe('hello');
  });

  it('appends content to existing source content', () => {
    const source = makeMessage({ content: 'Hello' });
    const result = mergeMessages(source, [{ content: ' World' }]);
    expect(result.content).toBe('Hello World');
  });

  it('accumulates content across multiple streaming chunks', () => {
    const source = makeMessage({ content: '' });
    const result = mergeMessages(source, [
      { content: 'chunk1' },
      { content: ' chunk2' },
      { content: ' chunk3' },
    ]);
    expect(result.content).toBe('chunk1 chunk2 chunk3');
  });

  it('does not modify content when new partial has no content field', () => {
    const source = makeMessage({ content: 'existing' });
    const result = mergeMessages(source, [
      { role: 'assistant' as Message['role'] },
    ]);
    expect(result.content).toBe('existing');
  });
});

// ---------------------------------------------------------------------------
// mergeMessages — delete_chars directive
// ---------------------------------------------------------------------------

describe('mergeMessages — delete_chars directive', () => {
  it('removes N characters from the end of content when delete_chars(N) is the content', () => {
    const source = makeMessage({ content: 'hello world' });
    const result = mergeMessages(source, [{ content: 'delete_chars(5)' }]);
    expect(result.content).toBe('hello ');
  });

  it('removes all characters when N equals the full content length', () => {
    const source = makeMessage({ content: 'abc' });
    const result = mergeMessages(source, [{ content: 'delete_chars(3)' }]);
    expect(result.content).toBe('');
  });

  it('can delete then append in subsequent partials', () => {
    // 'hello' → delete last 2 chars → 'hel' → append 'p' → 'help'
    const source = makeMessage({ content: 'hello' });
    const result = mergeMessages(source, [
      { content: 'delete_chars(2)' },
      { content: 'p' },
    ]);
    expect(result.content).toBe('help');
  });

  it('does not treat delete_chars as literal text', () => {
    const source = makeMessage({ content: 'abcd' });
    const result = mergeMessages(source, [{ content: 'delete_chars(2)' }]);
    expect(result.content).toBe('ab');
    expect(result.content).not.toContain('delete_chars');
  });
});

// ---------------------------------------------------------------------------
// mergeMessages — custom_content.attachments
// ---------------------------------------------------------------------------

describe('mergeMessages — custom_content.attachments', () => {
  const attachment1 = { type: 'text/plain', title: 'file1.txt' };
  const attachment2 = { type: 'text/plain', title: 'file2.txt' };

  it('initialises custom_content and attachments array when absent on source', () => {
    const source = makeMessage();
    const result = mergeMessages(source, [
      { custom_content: { attachments: [attachment1] } },
    ]);
    expect(result.custom_content?.attachments).toEqual([attachment1]);
  });

  it('concatenates new attachments to existing ones', () => {
    const source = makeMessage({
      custom_content: { attachments: [attachment1] },
    });
    const result = mergeMessages(source, [
      { custom_content: { attachments: [attachment2] } },
    ]);
    expect(result.custom_content?.attachments).toEqual([
      attachment1,
      attachment2,
    ]);
  });

  it('accumulates attachments from multiple partials', () => {
    const source = makeMessage();
    const result = mergeMessages(source, [
      { custom_content: { attachments: [attachment1] } },
      { custom_content: { attachments: [attachment2] } },
    ]);
    expect(result.custom_content?.attachments).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// mergeMessages — custom_content.stages
// ---------------------------------------------------------------------------

describe('mergeMessages — custom_content.stages', () => {
  it('initialises stages array when absent on source', () => {
    const source = makeMessage();
    const result = mergeMessages(source, [
      {
        custom_content: {
          stages: [{ index: 0, name: 'stage0', status: null }],
        },
      },
    ]);
    expect(result.custom_content?.stages).toHaveLength(1);
    expect(result.custom_content?.stages?.[0].index).toBe(0);
  });

  it('appends a new stage when its index does not exist in source', () => {
    const source = makeMessage({
      custom_content: {
        stages: [{ index: 0, name: 'stage0', status: null }],
      },
    });
    const result = mergeMessages(source, [
      {
        custom_content: {
          stages: [{ index: 1, name: 'stage1', status: null }],
        },
      },
    ]);
    expect(result.custom_content?.stages).toHaveLength(2);
  });

  it('appends content to an existing stage with the same index', () => {
    const source = makeMessage({
      custom_content: {
        stages: [{ index: 0, name: 'stage0', content: 'part1', status: null }],
      },
    });
    const result = mergeMessages(source, [
      {
        custom_content: {
          stages: [{ index: 0, name: '', content: ' part2', status: null }],
        },
      },
    ]);
    expect(result.custom_content?.stages?.[0].content).toBe('part1 part2');
  });

  it('updates status on an existing stage', () => {
    const source = makeMessage({
      custom_content: {
        stages: [{ index: 0, name: 'stage0', status: null }],
      },
    });
    const result = mergeMessages(source, [
      {
        custom_content: {
          stages: [{ index: 0, name: '', status: 'completed' }],
        },
      },
    ]);
    expect(result.custom_content?.stages?.[0].status).toBe('completed');
  });

  it('concatenates attachments on an existing stage', () => {
    const attachment = { type: 'text/plain', title: 'a.txt' };
    const source = makeMessage({
      custom_content: {
        stages: [
          { index: 0, name: 'stage0', attachments: [attachment], status: null },
        ],
      },
    });
    const newAttachment = { type: 'text/plain', title: 'b.txt' };
    const result = mergeMessages(source, [
      {
        custom_content: {
          stages: [
            { index: 0, name: '', attachments: [newAttachment], status: null },
          ],
        },
      },
    ]);
    expect(result.custom_content?.stages?.[0].attachments).toEqual([
      attachment,
      newAttachment,
    ]);
  });

  it('appends name to an existing stage', () => {
    const source = makeMessage({
      custom_content: {
        stages: [{ index: 0, name: 'part1', status: null }],
      },
    });
    const result = mergeMessages(source, [
      {
        custom_content: {
          stages: [{ index: 0, name: ' part2', status: null }],
        },
      },
    ]);
    expect(result.custom_content?.stages?.[0].name).toBe('part1 part2');
  });
});

// ---------------------------------------------------------------------------
// mergeMessages — custom_content.state, form_schema, form_value
// ---------------------------------------------------------------------------

describe('mergeMessages — custom_content state, form_schema, form_value', () => {
  it('sets custom_content.state when provided', () => {
    const state = { key: 'value' };
    const source = makeMessage();
    const result = mergeMessages(source, [{ custom_content: { state } }]);
    expect(result.custom_content?.state).toEqual(state);
  });

  it('overwrites custom_content.state with the latest value', () => {
    const source = makeMessage({ custom_content: { state: { key: 'old' } } });
    const result = mergeMessages(source, [
      { custom_content: { state: { key: 'new' } } },
    ]);
    expect(result.custom_content?.state).toEqual({ key: 'new' });
  });

  it('sets form_schema when provided', () => {
    const schema = { type: 'object' as const, properties: {} };
    const source = makeMessage();
    const result = mergeMessages(source, [
      { custom_content: { form_schema: schema as never } },
    ]);
    expect(result.custom_content?.form_schema).toEqual(schema);
  });

  it('sets form_value when provided', () => {
    const value = { field: 'answer' };
    const source = makeMessage();
    const result = mergeMessages(source, [
      { custom_content: { form_value: value as never } },
    ]);
    expect(result.custom_content?.form_value).toEqual(value);
  });
});
