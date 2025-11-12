import { Inter, Open_Sans } from 'next/font/google';
import './globals.scss';
import classNames from 'classnames';
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import SessionProviderWrapper from '../components/SessionProvider';
import { authOptions } from '../utils/auth/auth-options';

const font = Open_Sans({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-open-sans',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'StatGPT Portal',
  description: 'AI-powered conversation platform with DIAL API integration',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html>
      <head>
        <link rel="icon" href={'/images/favicon.svg'} sizes="any" />
        <link rel="apple-touch-icon" href={'/images/favicon.svg'} />
      </head>
      <body className={classNames(font.variable, inter.variable)}>
        <SessionProviderWrapper session={session}>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
