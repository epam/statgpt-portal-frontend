'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { ReactNode } from 'react';

const SessionProviderWrapper = ({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) => {
  return (
    <SessionProvider
      refetchOnWindowFocus
      session={session}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
};
export default SessionProviderWrapper;
