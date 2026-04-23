import { getSignInLink, SIGN_IN_LINK } from '../auth';

describe('getSignInLink', () => {
  it('returns base sign-in link when callbackUrl is not provided', () => {
    expect(getSignInLink()).toBe(SIGN_IN_LINK);
    expect(getSignInLink(null)).toBe(SIGN_IN_LINK);
  });

  it('returns base sign-in link when callbackUrl is empty after trimming', () => {
    expect(getSignInLink('')).toBe(SIGN_IN_LINK);
    expect(getSignInLink('   ')).toBe(SIGN_IN_LINK);
  });

  it('adds trimmed callbackUrl as a query parameter', () => {
    expect(getSignInLink('  /datasets/42  ')).toBe(
      `${SIGN_IN_LINK}?callbackUrl=%2Fdatasets%2F42`,
    );
  });

  it('encodes callbackUrl query characters', () => {
    expect(getSignInLink('/chat?conversationId=abc-123&view=table')).toBe(
      `${SIGN_IN_LINK}?callbackUrl=%2Fchat%3FconversationId%3Dabc-123%26view%3Dtable`,
    );
  });
});
