'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

const SessionProviderWrapper = ({
  children,
  session,
}: {
  children: React.ReactNode;
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
