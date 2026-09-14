import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';

const TERMINAL_SESSION_ERROR = 'RefreshTokenExpired';

/**
 * Signs the user out once the session carries the terminal
 * `RefreshTokenExpired` error. A transient `RefreshAccessTokenError` is left
 * alone since it can recover on its own on the next successful background
 * refresh.
 */
export function useSignOutOnSessionError(): void {
  const { data: session } = useSession();
  const hasSignedOutRef = useRef(false);
  const error = (session as { error?: string } | undefined)?.error;

  useEffect(() => {
    if (error !== TERMINAL_SESSION_ERROR || hasSignedOutRef.current) {
      return;
    }

    hasSignedOutRef.current = true;
    signOut();
  }, [error]);
}
