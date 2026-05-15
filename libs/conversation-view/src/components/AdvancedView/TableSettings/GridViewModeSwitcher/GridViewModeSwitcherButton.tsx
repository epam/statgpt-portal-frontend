import { type ReactNode } from 'react';
import { mergeClasses } from '../../../../../src/utils/mergeClasses';
import { CrossDatasetGridViewMode } from '../types';

type GridViewModeSwitcherButtonProps = {
  title: string;
  description: ReactNode;
  visual: ReactNode;
  mode: CrossDatasetGridViewMode;
  activeMode: CrossDatasetGridViewMode;
  onClick: (mode: CrossDatasetGridViewMode) => void;
};

export const GridViewModeSwitcherButton = ({
  title,
  description,
  visual,
  mode,
  activeMode,
  onClick,
}: GridViewModeSwitcherButtonProps) => (
  <button
    type="button"
    className={mergeClasses([
      'flex items-center gap-3 rounded border p-1',
      mode === activeMode && 'border-primary',
    ])}
    onClick={() => onClick(mode)}
  >
    <div className="rounded-[5px] bg-neutrals-100 px-2 py-1">{visual}</div>

    <div className="flex flex-col gap-1 text-left">
      <span className="h4 text-neutrals-1000">{title}</span>
      <span className="caption text-neutrals-800">{description}</span>
    </div>
  </button>
);
