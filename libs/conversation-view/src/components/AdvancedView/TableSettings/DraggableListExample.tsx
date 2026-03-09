'use client';

import {
  DraggableList,
  DraggableListNode,
  filterDraggableListNodes,
  ItemClickEvent,
  ToggleCheckedEvent,
  ToggleExpandedEvent,
} from '@epam/statgpt-ui-components';
import { useCallback, useMemo, useState } from 'react';

export const DraggableListExample = ({
  searchQuery,
}: {
  searchQuery: string;
}) => {
  const [items, setItems] = useState<DraggableListNode[]>([
    {
      type: 'item',
      id: 'agency',
      label: 'Agency',
      isChecked: true,
    },
    {
      type: 'item',
      id: 'dataset',
      label: 'Dataset',
      isChecked: true,
    },
    {
      type: 'item',
      id: 'country-dimensions',
      label: 'Country dimensions',
      isChecked: true,
    },
    {
      type: 'item',
      id: 'indicator-dimensions',
      label: 'Indicator dimensions',
      isChecked: true,
      isExpanded: true,
      items: [
        {
          type: 'group',
          id: 'world-economic-outlook-group',
          label: 'World Economic Outlook (WEO)',
          items: [
            {
              type: 'item',
              id: 'indicator',
              label: 'Indicator',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'scale',
              label: 'Scale',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'unit-of-measure',
              label: 'Unit of measure',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'imf-group',
          label: 'IMF: Production Indexes, World and Country Group Aggregates',
          items: [
            {
              type: 'item',
              id: 'production-index',
              label: 'Production index',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'type-transaction',
              label: 'Type of Transformation',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'unit-of-measure',
              label: 'Unit of measure',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'gdp-group',
          label: 'GDP per capita in PPS',
          items: [
            {
              type: 'item',
              id: 'account-indicator',
              label: 'National account indicator',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'seasonal-adjustment',
              label: 'Seasonal adjustment',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'unit-of-measure',
              label: 'Unit of measure',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'frequency',
      label: 'Frequency',
      isChecked: true,
    },
    {
      type: 'item',
      id: 'time-period',
      label: 'Time period',
      isChecked: true,
    },
    // new elements are bellow
    {
      type: 'item',
      id: 'population-dimensions',
      label: 'Population dimensions',
      isChecked: true,
      isExpanded: true,
      items: [
        {
          type: 'group',
          id: 'age-structure-group',
          label: 'Age structure',
          items: [
            { type: 'item', id: 'age', label: 'Age', isChecked: true },
            {
              type: 'item',
              id: 'age-group',
              label: 'Age group',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'median-age',
              label: 'Median age',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'gender-structure-group',
          label: 'Gender structure',
          items: [
            { type: 'item', id: 'sex', label: 'Sex', isChecked: true },
            {
              type: 'item',
              id: 'gender-balance',
              label: 'Gender balance',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'labour-market-dimensions',
      label: 'Labour market dimensions',
      isChecked: true,
      items: [
        {
          type: 'group',
          id: 'employment-group',
          label: 'Employment',
          items: [
            {
              type: 'item',
              id: 'employment-status',
              label: 'Employment status',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'employment-type',
              label: 'Employment type',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'hours-worked',
              label: 'Hours worked',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'unemployment-group',
          label: 'Unemployment',
          items: [
            {
              type: 'item',
              id: 'unemployment-rate',
              label: 'Unemployment rate',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'duration-unemployment',
              label: 'Duration of unemployment',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'education-dimensions',
      label: 'Education dimensions',
      isChecked: true,
      items: [
        {
          type: 'group',
          id: 'education-level-group',
          label: 'Education level',
          items: [
            {
              type: 'item',
              id: 'education-level',
              label: 'Education level',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'field-of-study',
              label: 'Field of study',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'school-enrolment-group',
          label: 'School enrolment',
          items: [
            {
              type: 'item',
              id: 'enrolment-rate',
              label: 'Enrolment rate',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'graduation-rate',
              label: 'Graduation rate',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'health-dimensions',
      label: 'Health statistics',
      isChecked: true,
      items: [
        {
          type: 'group',
          id: 'life-expectancy-group',
          label: 'Life expectancy',
          items: [
            {
              type: 'item',
              id: 'life-expectancy',
              label: 'Life expectancy',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'healthy-life-years',
              label: 'Healthy life years',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'mortality-group',
          label: 'Mortality indicators',
          items: [
            {
              type: 'item',
              id: 'infant-mortality',
              label: 'Infant mortality',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'maternal-mortality',
              label: 'Maternal mortality',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'trade-dimensions',
      label: 'International trade',
      isChecked: true,
      items: [
        {
          type: 'group',
          id: 'exports-group',
          label: 'Exports',
          items: [
            {
              type: 'item',
              id: 'export-value',
              label: 'Export value',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'export-volume',
              label: 'Export volume',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'imports-group',
          label: 'Imports',
          items: [
            {
              type: 'item',
              id: 'import-value',
              label: 'Import value',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'import-volume',
              label: 'Import volume',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'environment-dimensions',
      label: 'Environmental indicators',
      isChecked: true,
      items: [
        {
          type: 'group',
          id: 'emissions-group',
          label: 'Greenhouse gas emissions',
          items: [
            {
              type: 'item',
              id: 'co2-emissions',
              label: 'CO₂ emissions',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'methane-emissions',
              label: 'Methane emissions',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'energy-group',
          label: 'Energy consumption',
          items: [
            {
              type: 'item',
              id: 'energy-consumption',
              label: 'Total energy consumption',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'renewable-share',
              label: 'Renewable energy share',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'housing-dimensions',
      label: 'Housing statistics',
      isChecked: true,
      items: [
        {
          type: 'group',
          id: 'housing-prices-group',
          label: 'Housing prices',
          items: [
            {
              type: 'item',
              id: 'house-price-index',
              label: 'House price index',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'rent-price-index',
              label: 'Rent price index',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'housing-stock-group',
          label: 'Housing stock',
          items: [
            {
              type: 'item',
              id: 'dwellings',
              label: 'Number of dwellings',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'housing-completions',
              label: 'Housing completions',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'innovation-dimensions',
      label: 'Innovation and R&D',
      isChecked: true,
      items: [
        {
          type: 'group',
          id: 'research-group',
          label: 'Research activities',
          items: [
            {
              type: 'item',
              id: 'rd-expenditure',
              label: 'R&D expenditure',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'researchers',
              label: 'Number of researchers',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'patents-group',
          label: 'Patent activity',
          items: [
            {
              type: 'item',
              id: 'patent-applications',
              label: 'Patent applications',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'patent-grants',
              label: 'Patent grants',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'transport-dimensions',
      label: 'Transport statistics',
      isChecked: true,
      items: [
        {
          type: 'group',
          id: 'passenger-transport-group',
          label: 'Passenger transport',
          items: [
            {
              type: 'item',
              id: 'rail-passengers',
              label: 'Rail passengers',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'air-passengers',
              label: 'Air passengers',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'freight-transport-group',
          label: 'Freight transport',
          items: [
            {
              type: 'item',
              id: 'rail-freight',
              label: 'Rail freight',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'road-freight',
              label: 'Road freight',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'tourism-dimensions',
      label: 'Tourism statistics',
      isChecked: true,
      items: [
        {
          type: 'group',
          id: 'tourism-arrivals-group',
          label: 'Tourist arrivals',
          items: [
            {
              type: 'item',
              id: 'international-arrivals',
              label: 'International arrivals',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'domestic-arrivals',
              label: 'Domestic arrivals',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'tourism-spending-group',
          label: 'Tourism spending',
          items: [
            {
              type: 'item',
              id: 'tourism-revenue',
              label: 'Tourism revenue',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'tourism-expenditure',
              label: 'Tourism expenditure',
              isChecked: true,
            },
          ],
        },
      ],
    },
  ]);

  const visibleItems = useMemo(() => {
    return filterDraggableListNodes(items, searchQuery);
  }, [items, searchQuery]);

  const handleToggleChecked = useCallback((e: ToggleCheckedEvent) => {
    setItems((prev) =>
      updateAtPath(prev, e.path, (node) => {
        if (node.type !== 'item') return node;

        return {
          ...node,
          isChecked: e.nextChecked,
        };
      }),
    );
  }, []);

  const handleToggleExpanded = useCallback((e: ToggleExpandedEvent) => {
    setItems((prev) =>
      updateAtPath(prev, e.path, (node) => {
        if (node.type !== 'item') return node;

        return {
          ...node,
          isExpanded: e.nextExpanded,
        };
      }),
    );
  }, []);

  const handleItemClick = useCallback((e: ItemClickEvent) => {
    setItems((prev) =>
      updateAtPath(prev, e.path, (node) => {
        if (node.type !== 'item') return node;

        const isDisabled = !!node.isDisabled;
        const checkable = isDisabled ? false : (node.checkable ?? true);

        if (!checkable) return node;

        return {
          ...node,
          isChecked: !node.isChecked,
        };
      }),
    );
  }, []);

  return (
    <DraggableList
      items={visibleItems}
      onItemsChange={setItems}
      onToggleChecked={handleToggleChecked}
      onToggleExpanded={handleToggleExpanded}
      onItemClick={handleItemClick}
    />
  );
};

function updateAtPath(
  nodes: DraggableListNode[],
  path: readonly string[],
  updater: (node: DraggableListNode) => DraggableListNode,
): DraggableListNode[] {
  if (path.length === 0) return nodes;

  const [head, ...tail] = path;

  return nodes.map((node) => {
    if (node.id !== head) return node;

    if (tail.length === 0) {
      return updater(node);
    }

    if (!node.items) return node;

    return {
      ...node,
      items: updateAtPath(node.items, tail, updater),
    };
  });
}
