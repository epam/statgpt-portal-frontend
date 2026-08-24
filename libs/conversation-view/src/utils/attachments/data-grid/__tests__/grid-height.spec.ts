import { getGridHeight } from '../grid-height';
import {
  GRID_HEADER_HEIGHT,
  GRID_HORIZONTAL_SCROLL_GAP,
  GRID_ROW_HEIGHT,
} from '../../../../constants/grid';

describe('getGridHeight', () => {
  it('uses the shared row/header height constants when no overrides are passed', () => {
    const rowDataLength = 3;
    expect(getGridHeight(rowDataLength)).toBe(
      rowDataLength * GRID_ROW_HEIGHT +
        GRID_HEADER_HEIGHT +
        GRID_HORIZONTAL_SCROLL_GAP,
    );
  });

  it('returns just the header height and scroll gap for zero rows', () => {
    expect(getGridHeight(0)).toBe(GRID_HEADER_HEIGHT + GRID_HORIZONTAL_SCROLL_GAP);
  });

  it('uses a custom row height when passed', () => {
    expect(getGridHeight(2, 44)).toBe(
      2 * 44 + GRID_HEADER_HEIGHT + GRID_HORIZONTAL_SCROLL_GAP,
    );
  });

  it('uses a custom header height when passed', () => {
    expect(getGridHeight(2, undefined, 44)).toBe(
      2 * GRID_ROW_HEIGHT + 44 + GRID_HORIZONTAL_SCROLL_GAP,
    );
  });

  it('uses both custom row and header heights when passed', () => {
    expect(getGridHeight(2, 44, 44)).toBe(2 * 44 + 44 + GRID_HORIZONTAL_SCROLL_GAP);
  });
});
