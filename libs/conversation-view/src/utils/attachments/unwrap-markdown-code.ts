/**
 * Strips the opening and closing triple-backtick fences from a Markdown code block
 * and returns the inner code along with the detected language identifier.
 *
 * @param input - Raw string that may be a fenced Markdown code block or plain text.
 */
export function unwrapMarkdownCode(input: string): {
  code: string;
  language?: string;
} {
  const text = input.replace(/\r\n/g, '\n');

  if (!text.startsWith('```')) {
    return { code: input };
  }

  const lines = text.split('\n');
  const firstLine = lines[0];

  const language = firstLine.slice(3).trim() || undefined;

  let closingIndex = -1;
  for (let i = lines.length - 1; i > 0; i--) {
    if (lines[i].trim() === '```') {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    return {
      code: lines.slice(1).join('\n'),
      language,
    };
  }

  return {
    code: lines.slice(1, closingIndex).join('\n'),
    language,
  };
}
