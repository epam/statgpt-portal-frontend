import withAuth from 'next-auth/middleware';
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getIsEnableAuthToggle } from './utils/auth/get-auth-toggle';

const locales = ['en'] as const;
type Locale = (typeof locales)[number];

const defaultLocale: Locale = 'en';

const I18nMiddleware = createI18nMiddleware({
  locales,
  defaultLocale,
});

export const config = {
  matcher: [
    '/((?!api|static|.*\\..*|_next/static|_next/image|images|favicon.ico|robots.txt).*)',
  ],
};

const CSPMiddleware = (request: Request): NextResponse => {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http: ${
      process.env.NODE_ENV === 'production' ? '' : `'unsafe-eval'`
    };

    style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self' data: https://cdn.jsdelivr.net fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    frame-ancestors ${process.env.ALLOWED_FRAME_ANCESTORS ?? "'none'"};
    ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
`;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue,
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue,
  );

  return response;
};

export const I18MiddlewareWithCSP = (req: NextRequest) => {
  const i18nResponse = I18nMiddleware(req);
  if (i18nResponse instanceof NextResponse) {
    const cspResponse = CSPMiddleware(req);
    const cspPolicy = cspResponse.headers.get('Content-Security-Policy');

    if (cspPolicy) {
      i18nResponse.headers.set('Content-Security-Policy', cspPolicy);
    }

    return i18nResponse;
  }
};

async function middlewareFn(req: NextRequest) {
  return I18MiddlewareWithCSP(req);
}

const middleware = getIsEnableAuthToggle()
  ? withAuth(middlewareFn)
  : middlewareFn;

export default middleware;
