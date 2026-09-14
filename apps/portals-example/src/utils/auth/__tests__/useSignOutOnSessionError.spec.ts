import { renderHook } from '@testing-library/react';
import { useSignOutOnSessionError } from '../useSignOutOnSessionError';

const mockUseSession = jest.fn();
const mockSignOut = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

describe('useSignOutOnSessionError', () => {
  beforeEach(() => {
    mockUseSession.mockReset();
    mockSignOut.mockReset();
  });

  it('does not call signOut when the session has no error', () => {
    mockUseSession.mockReturnValue({ data: { user: {} } });

    renderHook(() => useSignOutOnSessionError());

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('does not call signOut while the session is still loading', () => {
    mockUseSession.mockReturnValue({ data: undefined });

    renderHook(() => useSignOutOnSessionError());

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('calls signOut once the session carries a RefreshTokenExpired error', () => {
    mockUseSession.mockReturnValue({
      data: { user: {}, error: 'RefreshTokenExpired' },
    });

    renderHook(() => useSignOutOnSessionError());

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('does not call signOut for a transient RefreshAccessTokenError — it should self-heal on the next refresh', () => {
    mockUseSession.mockReturnValue({
      data: { user: {}, error: 'RefreshAccessTokenError' },
    });

    renderHook(() => useSignOutOnSessionError());

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('only calls signOut once across re-renders with the same error', () => {
    mockUseSession.mockReturnValue({
      data: { user: {}, error: 'RefreshTokenExpired' },
    });

    const { rerender } = renderHook(() => useSignOutOnSessionError());
    rerender();
    rerender();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
