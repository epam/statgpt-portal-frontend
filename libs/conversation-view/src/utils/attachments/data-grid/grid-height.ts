import {
  GRID_HEADER_HEIGHT,
  GRID_HORIZONTAL_SCROLL_GAP,
  GRID_ROW_HEIGHT,
} from '../../../constants/grid';

export const getGridHeight = (
  rowDataLength: number,
  rowHeight: number = GRID_ROW_HEIGHT,
  headerHeight: number = GRID_HEADER_HEIGHT,
): number => {
  return rowDataLength * rowHeight + headerHeight + GRID_HORIZONTAL_SCROLL_GAP;
};
