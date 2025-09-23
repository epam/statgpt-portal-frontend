'use client';

import { FilterValue } from '../../../../../models/filters';
import { Checkbox } from '@statgpt/ui-components/src/components/Checkbox/Checkbox';
import { FC, ReactNode } from 'react';

interface Props {
  index: number;
  style: React.CSSProperties;
  filterValue: FilterValue;
  checkboxIcon: ReactNode;
  selectFilterValue: (id: string, isSelectedValue?: boolean) => void;
}

const CheckboxRow: FC<Props> = ({
  style,
  filterValue,
  checkboxIcon,
  selectFilterValue,
}) => (
  <div style={style}>
    <Checkbox
      id={filterValue.id}
      label={filterValue.name}
      checked={!!filterValue.isSelectedValue}
      checkboxIcon={checkboxIcon}
      onChange={selectFilterValue}
    />
  </div>
);

export default CheckboxRow;
