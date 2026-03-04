type LinkifiedPart =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string };

// Common punctuation that often follows a URL in prose and shouldn't be part of the link.
const TRAILING_PUNCTUATION = new Set([
  ')',
  ']',
  '}',
  '>',
  ',',
  '.',
  '!',
  '?',
  ':',
  ';',
]);

export function splitTrailingPunctuation(url: string): {
  cleanUrl: string;
  trailing: string;
} {
  let end = url.length;

  while (end > 0 && TRAILING_PUNCTUATION.has(url[end - 1])) {
    end--;
  }

  if (end === url.length) {
    return { cleanUrl: url, trailing: '' };
  }

  return {
    cleanUrl: url.slice(0, end),
    trailing: url.slice(end),
  };
}

/**
 * Splits input into text + link parts.
 * - Only http/https are linkified.
 * - Trailing punctuation is split off into a following text part.
 */
export function linkifyText(input: string): LinkifiedPart[] {
  if (!input) return [{ type: 'text', value: '' }];

  const parts: LinkifiedPart[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(/\bhttps?:\/\/[^\s<>"']+/gi)) {
    const rawUrl = match[0];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      parts.push({ type: 'text', value: input.slice(lastIndex, matchIndex) });
    }

    const { cleanUrl, trailing } = splitTrailingPunctuation(rawUrl);

    if (cleanUrl) {
      parts.push({ type: 'link', value: cleanUrl });
    } else {
      parts.push({ type: 'text', value: rawUrl });
    }

    if (trailing) {
      parts.push({ type: 'text', value: trailing });
    }

    lastIndex = matchIndex + rawUrl.length;
  }

  if (lastIndex < input.length) {
    parts.push({ type: 'text', value: input.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: 'text', value: input }];
}
