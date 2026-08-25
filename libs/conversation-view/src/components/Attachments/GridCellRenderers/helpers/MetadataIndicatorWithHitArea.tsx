'use client';

import { FC } from 'react';

const HIT_AREA_STYLE = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  right: 0,
  width: 'min(44px, 100%)',
} as const;

interface MetadataIndicatorWithHitAreaProps {
  title: string;
  onClick: () => void;
}

/**
 * Corner indicator opening per-dimension/dataset/observation metadata:
 * `.metadata-indicator` (app-styled triangle) plus an invisible, larger
 * click target — both call `onClick` independently, but the triangle's own
 * handler is only ever reached if a consumer's CSS repositions the hit area
 * away from it; by default the hit area (rendered after the triangle,
 * absolutely positioned over it) always wins the pointer event.
 *
 * The hit area is sized via inline `style`, not a CSS class: this ships
 * inside a compiled npm package with no CSS of its own, and a new class
 * would need matching SCSS added in every consuming repo to ever take
 * effect.
 *
 * Renders both elements as direct children of a `position: static` cell
 * root. They rely on `position: absolute` with no positioned ancestor
 * before ag-grid's own `.ag-cell` (always `position: absolute; height:
 * 100%`), so they anchor to the real cell box on any row height.
 * @param title - Tooltip text shown on hover.
 * @param onClick - Handler invoked when either element is clicked.
 */
export const MetadataIndicatorWithHitArea: FC<
  MetadataIndicatorWithHitAreaProps
> = ({ title, onClick }) => (
  <>
    <div className="metadata-indicator" onClick={onClick} />
    <div
      className="cursor-pointer"
      style={HIT_AREA_STYLE}
      title={title}
      onClick={onClick}
    />
  </>
);
