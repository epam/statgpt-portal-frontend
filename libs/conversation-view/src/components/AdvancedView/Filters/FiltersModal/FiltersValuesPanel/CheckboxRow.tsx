'use client';

import { FilterValue } from '../../../../../models/filters';
import { Checkbox } from '@epam/statgpt-ui-components';
import { CSSProperties, FC, ReactNode } from 'react';

interface Props {
  index: number;
  style: CSSProperties;
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
