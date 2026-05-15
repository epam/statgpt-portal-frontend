import { type ReactNode } from 'react';
import { CompactViewScheme, ExtendedViewScheme } from './schemes';
import { GridViewModeSwitcherButton } from './GridViewModeSwitcherButton';
import { CrossDatasetGridViewMode } from '../types';

type GridViewModeSwitcherProps = {
  gridViewMode: CrossDatasetGridViewMode;
  onModeChange: (mode: CrossDatasetGridViewMode) => void;
  compactViewTitle?: string;
  compactViewDescription?: ReactNode;
  extendedViewTitle?: string;
  extendedViewDescription?: ReactNode;
};

export const GridViewModeSwitcher = ({
  gridViewMode,
  onModeChange,
  compactViewTitle,
  compactViewDescription,
  extendedViewTitle,
  extendedViewDescription,
}: GridViewModeSwitcherProps) => (
  <div className="mx-5 my-3 flex flex-col gap-2">
    <GridViewModeSwitcherButton
      title={compactViewTitle || 'Compact view'}
      description={
        compactViewDescription ?? (
          <>
            Related dimensions <strong>combined into a single column.</strong>
          </>
        )
      }
      visual={<CompactViewScheme />}
      mode={CrossDatasetGridViewMode.Compact}
      activeMode={gridViewMode}
      onClick={onModeChange}
    />
    <GridViewModeSwitcherButton
      title={extendedViewTitle || 'Extended view'}
      description={
        extendedViewDescription ?? (
          <>
            Each dimension displayed in <strong>separate column.</strong>
          </>
        )
      }
      visual={<ExtendedViewScheme />}
      mode={CrossDatasetGridViewMode.Extended}
      activeMode={gridViewMode}
      onClick={onModeChange}
    />
  </div>
);
