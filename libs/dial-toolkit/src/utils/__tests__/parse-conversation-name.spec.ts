import { Entity } from '@epam/ai-dial-shared';

import {
  generateConversationId,
  parseConversationName,
} from '../parse-conversation-name';
import { CreateConversationRequest } from '../../models/conversation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeEntity = (name: string | undefined): Entity =>
  ({ name }) as unknown as Entity;

const makeRequest = (
  name: string,
  folderId: string,
): CreateConversationRequest => ({ name, folderId });

// ---------------------------------------------------------------------------
// parseConversationName
// ---------------------------------------------------------------------------

describe('parseConversationName', () => {
  it('splits modelId and conversationName on the first __ separator', () => {
    const result = parseConversationName(makeEntity('gpt-4__My Chat'));
    expect(result).toEqual({ modelId: 'gpt-4', conversationName: 'My Chat' });
  });

  it('rejoins remaining parts when there are multiple __ separators', () => {
    const result = parseConversationName(makeEntity('gpt-4__part1__part2'));
    expect(result).toEqual({
      modelId: 'gpt-4',
      conversationName: 'part1__part2',
    });
  });

  it('returns the whole name as conversationName when there is no __ separator', () => {
    const result = parseConversationName(makeEntity('plain-name'));
    expect(result).toEqual({ modelId: 'plain-name', conversationName: 'plain-name' });
  });

  it('returns the modelId segment as the first part before __', () => {
    const result = parseConversationName(makeEntity('claude-3__Hello'));
    expect(result.modelId).toBe('claude-3');
  });

  it('handles an empty string name', () => {
    const result = parseConversationName(makeEntity(''));
    expect(result).toEqual({ modelId: '', conversationName: '' });
  });

  it('handles an undefined name', () => {
    const result = parseConversationName(makeEntity(undefined));
    expect(result).toEqual({ modelId: undefined, conversationName: undefined });
  });

  it('handles a name that is only the separator __', () => {
    const result = parseConversationName(makeEntity('__'));
    expect(result).toEqual({ modelId: '', conversationName: '' });
  });

  it('handles a name that starts with __ (empty modelId)', () => {
    const result = parseConversationName(makeEntity('__title'));
    expect(result).toEqual({ modelId: '', conversationName: 'title' });
  });
});

// ---------------------------------------------------------------------------
// generateConversationId
// ---------------------------------------------------------------------------

describe('generateConversationId', () => {
  const FIXED_TIMESTAMP = 1700000000000;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIMESTAMP);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('combines folderId, cleared name slug, and timestamp', () => {
    const request = makeRequest('Hello World', 'default');
    const result = generateConversationId(request);
    expect(result).toBe(`default/hello world-${FIXED_TIMESTAMP}`);
  });

  it('uses the exact timestamp returned by Date.now()', () => {
    const request = makeRequest('chat', 'user-folder');
    const result = generateConversationId(request);
    expect(result).toContain(`-${FIXED_TIMESTAMP}`);
  });

  it('uses the folderId as the path prefix', () => {
    const request = makeRequest('chat', 'my-bucket');
    const result = generateConversationId(request);
    expect(result.startsWith('my-bucket/')).toBe(true);
  });

  it('clears special characters from the name slug', () => {
    const request = makeRequest('My Chat!', 'default');
    const result = generateConversationId(request);
    expect(result).toBe(`default/my chat-${FIXED_TIMESTAMP}`);
  });

  it('handles an empty name by producing an empty slug', () => {
    const request = makeRequest('', 'default');
    const result = generateConversationId(request);
    expect(result).toBe(`default/-${FIXED_TIMESTAMP}`);
  });
});
