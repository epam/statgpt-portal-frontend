import { handleStreamMessage } from '../chat-stream-api';
import { MessageStreamResponse } from '../../models/chat-stream';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const response = (
  overrides: Partial<MessageStreamResponse> = {},
): MessageStreamResponse => ({
  choices: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// handleStreamMessage
// ---------------------------------------------------------------------------

describe('handleStreamMessage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls onMessage with the data', () => {
    const data = response({ content: 'hello' });
    const onMessage = jest.fn();
    handleStreamMessage(data, onMessage);
    expect(onMessage).toHaveBeenCalledWith(data);
  });

  it('does not throw when onMessage is omitted', () => {
    const data = response({ content: 'hello' });
    expect(() => handleStreamMessage(data)).not.toThrow();
  });

  it('does not call onToken when onToken is omitted', () => {
    const data = response({ content: 'hello' });
    expect(() => handleStreamMessage(data, jest.fn())).not.toThrow();
  });

  it('extracts token from direct content format', () => {
    const data = response({ content: 'direct content' });
    const onToken = jest.fn();
    handleStreamMessage(data, undefined, onToken);
    expect(onToken).toHaveBeenCalledWith('direct content');
  });

  it('extracts token from OpenAI delta format', () => {
    const data = response({
      choices: [{ delta: { content: 'delta content' }, message: {} }],
    });
    const onToken = jest.fn();
    handleStreamMessage(data, undefined, onToken);
    expect(onToken).toHaveBeenCalledWith('delta content');
  });

  it('extracts token from complete message format', () => {
    const data = response({
      choices: [{ delta: {}, message: { content: 'message content' } }],
    });
    const onToken = jest.fn();
    handleStreamMessage(data, undefined, onToken);
    expect(onToken).toHaveBeenCalledWith('message content');
  });

  it('does not call onToken when no extractable content exists', () => {
    const data = response({
      choices: [{ delta: {}, message: {} }],
    });
    const onToken = jest.fn();
    handleStreamMessage(data, undefined, onToken);
    expect(onToken).not.toHaveBeenCalled();
  });

  it('does not call onToken when choices array is empty', () => {
    const data = response({ choices: [] });
    const onToken = jest.fn();
    handleStreamMessage(data, undefined, onToken);
    expect(onToken).not.toHaveBeenCalled();
  });

  it('prefers direct content over delta content', () => {
    const data = response({
      content: 'direct',
      choices: [{ delta: { content: 'delta' }, message: {} }],
    });
    const onToken = jest.fn();
    handleStreamMessage(data, undefined, onToken);
    expect(onToken).toHaveBeenCalledWith('direct');
  });

  it('prefers delta content over message content', () => {
    const data = response({
      choices: [{ delta: { content: 'delta' }, message: { content: 'message' } }],
    });
    const onToken = jest.fn();
    handleStreamMessage(data, undefined, onToken);
    expect(onToken).toHaveBeenCalledWith('delta');
  });

  it('calls both onMessage and onToken', () => {
    const data = response({ content: 'hello' });
    const onMessage = jest.fn();
    const onToken = jest.fn();
    handleStreamMessage(data, onMessage, onToken);
    expect(onMessage).toHaveBeenCalledWith(data);
    expect(onToken).toHaveBeenCalledWith('hello');
  });
});
