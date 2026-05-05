import { CompactViewScheme, ExtendedViewScheme } from './schemes';
import { GridViewModeSwitcherButton } from './GridViewModeSwitcherButton';
import { CrossDatasetGridViewMode } from '../types';

type GridViewModeSwitcherProps = {
  gridViewMode: CrossDatasetGridViewMode;
  onModeChange: (mode: CrossDatasetGridViewMode) => void;
};

export const GridViewModeSwitcher = ({
  gridViewMode,
  onModeChange,
}: GridViewModeSwitcherProps) => (
  <div className="mx-5 my-3 flex flex-col gap-2">
    <GridViewModeSwitcherButton
      title="Compact"
      description="Related dimensions combined into a single column."
      visual={<CompactViewScheme />}
      mode={CrossDatasetGridViewMode.Compact}
      activeMode={gridViewMode}
      onClick={onModeChange}
    />
    <GridViewModeSwitcherButton
      title="Extended"
      description="Each dimension displayed in separate column."
      visual={<ExtendedViewScheme />}
      mode={CrossDatasetGridViewMode.Extended}
      activeMode={gridViewMode}
      onClick={onModeChange}
    />
  </div>
);
