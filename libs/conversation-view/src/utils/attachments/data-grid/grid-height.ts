import {
  GRID_HEADER_HEIGHT,
  GRID_HORIZONTAL_SCROLL_GAP,
  GRID_ROW_HEIGHT,
} from '@statgpt/conversation-view/src/constants/grid';

export const getGridHeight = (rowDataLength: number): number => {
  return (
    rowDataLength * GRID_ROW_HEIGHT +
    GRID_HEADER_HEIGHT +
    GRID_HORIZONTAL_SCROLL_GAP
  );
};
