import { FC } from 'react';
import classNames from 'classnames';

interface Props {
  overlayClasses?: string;
  targetPosition: DOMRect;
  onClose: () => void;
}

const OUTLINE_SPACING = 5;

export const TooltipOverlay: FC<Props> = ({
  targetPosition,
  overlayClasses,
  onClose,
}) => {
  return (
    <>
      <div
        className="overlay overlay-top"
        style={{
          height: targetPosition.top,
          top: 0 - OUTLINE_SPACING,
          bottom: targetPosition.top + OUTLINE_SPACING,
        }}
      ></div>
      <div
        className="overlay overlay-bottom"
        style={{
          top: targetPosition.bottom + OUTLINE_SPACING,
          bottom: 0,
        }}
      ></div>
      <div
        className="overlay overlay-left"
        style={{
          top: targetPosition.top - OUTLINE_SPACING,
          height: targetPosition.height + OUTLINE_SPACING * 2,
          width: targetPosition.left,
          left: 0 - OUTLINE_SPACING,
          right: targetPosition.left - OUTLINE_SPACING * 2,
        }}
      ></div>
      <div
        className="overlay overlay-right"
        style={{
          top: targetPosition.top - OUTLINE_SPACING,
          left: targetPosition.right + OUTLINE_SPACING,
          height: targetPosition.height + OUTLINE_SPACING * 2,
          right: 0,
        }}
      ></div>
      <div
        className={classNames('outline-block z-10', overlayClasses)}
        onClick={onClose}
        style={{
          top: targetPosition.top,
          left: targetPosition.left,
          height: targetPosition.height,
          width: targetPosition.width,
        }}
      />
    </>
  );
};
