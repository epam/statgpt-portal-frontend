'use client';

import { FC } from 'react';
import { FiltersProps } from '../../../models/filters';
import FiltersModalShell from '../Filters/FiltersModal/FiltersModalShell';
import { useMultiDatasetFilters } from './hooks/use-multi-dataset-filters';

const MultiDatasetFilters: FC<FiltersProps> = (props) => {
  const shellProps = useMultiDatasetFilters(props);

  return <FiltersModalShell {...shellProps} />;
};

export default MultiDatasetFilters;
