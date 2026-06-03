import { renderHook, act } from '@testing-library/react';
import { useClampToggle } from '../useClampToggle';

describe('useClampToggle', () => {
  it('starts collapsed and not toggleable', () => {
    const { result } = renderHook(() => useClampToggle('text'));

    expect(result.current.isExpanded).toBe(false);
    expect(result.current.canToggle).toBe(false);
  });

  it('flips isExpanded when toggle is called', () => {
    const { result } = renderHook(() => useClampToggle('text'));

    act(() => result.current.toggle());
    expect(result.current.isExpanded).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isExpanded).toBe(false);
  });

  it('exposes a value ref', () => {
    const { result } = renderHook(() => useClampToggle('text'));

    expect(result.current.valueRef).toHaveProperty('current');
  });
});
