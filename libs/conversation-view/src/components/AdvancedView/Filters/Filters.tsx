'use client';

import { FC } from 'react';
import { FiltersProps } from '../../../models/filters';
import FiltersModalShell from './FiltersModal/FiltersModalShell';
import { useSingleDatasetFilters } from './hooks/use-single-dataset-filters';

const Filters: FC<FiltersProps> = (props) => {
  const shellProps = useSingleDatasetFilters(props);

  return <FiltersModalShell {...shellProps} />;
};

export default Filters;
