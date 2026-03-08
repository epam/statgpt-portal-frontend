import {
  DataConstraints,
  Dimension,
  DimensionType,
  findCodelistByDimension,
  getAnnotationPeriod,
  getAvailableCodes,
  getDimensionTitle,
  StructuralData,
  StructureItemBase,
} from '@epam/statgpt-sdmx-toolkit';
import { Filter, FilterTreeNodeProps, FilterValue } from '../models/filters';
import {
  DataQuery,
  QueryFilter,
  getTimePeriod,
} from '@epam/statgpt-shared-toolkit';
import {
  TREE_NODE_ARROW_SIZE,
  TREE_NODE_PADDING,
} from '@epam/statgpt-ui-components';
import { FilterDisplayMode } from '../constants/filter-display-mode';
import { getMergedTimeRange } from './attachments/time-period';
import { ConversationViewTitles } from '../models/titles';

export const getDatasetFilters = (
  dimensions?: Dimension[],
  structures?: StructuralData,
  structureDimensions?: StructureItemBase[],
  locale?: string,
): Filter[] => {
  return (
    dimensions?.map((dimension) => {
      const codes = findCodelistByDimension(
        structures?.codelists,
        structures?.conceptSchemes,
        dimension,
      )?.codes;
      const dimensionValues = getAvailableCodes(
        dimension,
        structureDimensions,
        codes,
        locale,
      );
      const isHierarchical = codes?.some((code) => code?.parent);
      return {
        id: dimension?.id,
        title: getDimensionTitle(structures?.conceptSchemes, dimension, locale),
        dimensionValues,
        isTimeDimension: dimension?.type === DimensionType.TIME_DIMENSION,
        isHierarchical,
        displayMode: isHierarchical
          ? FilterDisplayMode.HIERARCHY
          : FilterDisplayMode.FLAT_LIST,
      };
    }) || []
  );
};

export const updateFiltersWithSelectedItem = (
  filters: Filter[],
  selectedFilter?: Filter,
): Filter[] => {
  return filters?.map((filterItem) =>
    selectedFilter && filterItem?.id === selectedFilter?.id
      ? { ...selectedFilter, isSelectedFilter: true }
      : {
          ...filterItem,
          isSelectedFilter: false,
        },
  );
};

export const updateFiltersWithDisplayMode = (
  filters: Filter[],
  filterId?: string,
  displayMode?: string,
): Filter[] => {
  if (!filters) {
    return [];
  }

  return filters.map((filter) => {
    if (filter?.id === filterId) {
      return {
        ...filter,
        displayMode,
      };
    }
    return filter;
  });
};

export const getSelectedDimensionValues = (
  dimensionValues?: FilterValue[],
): FilterValue[] => {
  return dimensionValues?.filter((value) => !!value?.isSelectedValue) || [];
};

export const getSelectedFilterValues = (filters: Filter[]): Filter[] => {
  return filters
    ?.map((filterItem) => ({
      ...filterItem,
      dimensionValues: getSelectedDimensionValues(filterItem?.dimensionValues),
    }))
    .filter(
      (filterItem) =>
        filterItem.dimensionValues?.length ||
        filterItem.timeRange?.startPeriod ||
        filterItem.timeRange?.endPeriod,
    );
};

export const getTotalSelectedValuesLength = (
  selectedFilterValues: Filter[],
): number => {
  return (
    selectedFilterValues?.reduce(
      (valuesLength, filter) =>
        (filter?.dimensionValues?.length ?? 0) + valuesLength,
      0,
    ) || 0
  );
};

export const clearFilterValues = (filter: Filter): Filter => {
  return {
    ...filter,
    dimensionValues: filter?.dimensionValues?.map((value) => ({
      ...value,
      isSelectedValue: false,
    })),
    timeRange: void 0,
  };
};

export const getFiltersAfterDelete = (
  filters: Filter[],
  deleteFilterId?: string,
): Filter[] => {
  return filters?.map((filter) => {
    if (filter?.id === deleteFilterId) {
      return clearFilterValues(filter);
    }
    return filter;
  });
};

export const getFiltersAfterClear = (filters: Filter[]): Filter[] => {
  return filters?.map((filter) => clearFilterValues(filter));
};

// review
export const getFiltersPreselectedByDataQuery = (
  filters: Filter[],
  attachmentsFilters?: DataQuery,
  constraints?: DataConstraints[],
): Filter[] =>
  filters.map((filter) => {
    const filterFromAttachment = attachmentsFilters?.filters.find(
      (aFilter: QueryFilter) => aFilter.componentCode === filter.id,
    );
    let dimensionValues: FilterValue[] | undefined = [];

    if (filterFromAttachment) {
      if (filter.isTimeDimension) {
        const periods: string[] = filterFromAttachment.values.filter(
          (p) => !!p,
        );

        const constraintsTimeRange = getAnnotationPeriod(
          constraints?.[0]?.annotations,
        );
        const startPeriod = periods[0] ? getTimePeriod(periods[0]) : null;
        const endPeriod = periods[1] ? getTimePeriod(periods[1]) : null;

        let timeRange = constraintsTimeRange;

        if (startPeriod && endPeriod) {
          timeRange = constraintsTimeRange
            ? getMergedTimeRange(
                { startPeriod, endPeriod },
                constraintsTimeRange,
              )
            : { startPeriod, endPeriod };
        }

        return {
          ...filter,
          timeRange,
        };
      } else {
        const newValues = filter?.dimensionValues?.map((val) => {
          if (filterFromAttachment?.values?.includes(val.id)) {
            return { ...val, isSelectedValue: true };
          }

          return val;
        });
        dimensionValues = newValues;
      }
    } else {
      dimensionValues = filter.dimensionValues;
    }

    return { ...filter, dimensionValues };
  });

export const updateFiltersWithDisabledOption = (filters: Filter[]) => {
  return filters?.map((filter) => ({
    ...filter,
    isDisabled: true,
  }));
};

const getFilterTreeNodesMap = (
  filterValues: FilterValue[],
): Map<string, FilterTreeNodeProps> => {
  return new Map(
    filterValues?.map((filterValue) => [
      filterValue.id,
      { ...filterValue, children: [] },
    ]),
  );
};

export const getFilterValuesTree = (
  filterValues?: FilterValue[],
): FilterTreeNodeProps[] => {
  if (!filterValues) {
    return [];
  }

  const filterTreeNodesMap = getFilterTreeNodesMap(filterValues);
  const filterValuesTree: FilterTreeNodeProps[] = [];

  filterValues.forEach((value) => {
    if (value && value.parent) {
      const parentNode = filterTreeNodesMap.get(value.parent);
      const currentNode = filterTreeNodesMap.get(value.id);
      if (parentNode && parentNode.children && currentNode) {
        parentNode.children = [...parentNode.children, currentNode];
      }
    } else {
      const treeNode = filterTreeNodesMap.get(value.id);
      if (treeNode) {
        filterValuesTree.push(treeNode);
      }
    }
  });

  return filterValuesTree;
};

export const getFilterTreeNodePadding = (
  level: number,
  isHasChildren = false,
): string => {
  return isHasChildren
    ? `${level * TREE_NODE_PADDING - TREE_NODE_ARROW_SIZE}px`
    : `${level * TREE_NODE_PADDING}px`;
};

const getAllChildrenNodes = (
  node: FilterTreeNodeProps,
): FilterTreeNodeProps[] => {
  return (
    node?.children?.reduce<FilterTreeNodeProps[]>(
      (childrenNodes, child) => [
        ...childrenNodes,
        child,
        ...getAllChildrenNodes(child),
      ],
      [],
    ) || []
  );
};

const setSelectedChildrenNodes = (
  childrenNodes?: FilterTreeNodeProps[],
  isSelectedValue?: boolean,
): FilterTreeNodeProps[] => {
  if (!childrenNodes) {
    return [];
  }

  return childrenNodes.map((child) => ({
    ...child,
    isSelectedValue,
  }));
};

export const getFilterNodesBySelection = (
  node: FilterTreeNodeProps,
): FilterTreeNodeProps[] => {
  const allChildrenSelected = node.children?.every(
    (child) => child.isSelectedValue,
  );
  const allChildrenUnselected = node.children?.every(
    (child) => !child.isSelectedValue,
  );

  if (!node.isSelectedValue) {
    if (allChildrenUnselected) {
      return [
        { ...node, isSelectedValue: true },
        ...setSelectedChildrenNodes(getAllChildrenNodes(node), true),
      ];
    }
    if (allChildrenSelected) {
      return [
        { ...node, isSelectedValue: true },
        ...setSelectedChildrenNodes(getAllChildrenNodes(node), false),
      ];
    }
  } else if (node.isSelectedValue && allChildrenSelected) {
    return [
      { ...node, isSelectedValue: false },
      ...setSelectedChildrenNodes(getAllChildrenNodes(node), true),
    ];
  }

  return [
    { ...node, isSelectedValue: false },
    ...setSelectedChildrenNodes(getAllChildrenNodes(node), false),
  ];
};

export const getFilterDisplaySettings = (titles?: ConversationViewTitles) => {
  return [
    {
      key: FilterDisplayMode.HIERARCHY,
      title: titles?.hierarchy || 'Hierarchy',
    },
    {
      key: FilterDisplayMode.FLAT_LIST,
      title: titles?.flatList || 'Flat list',
    },
  ];
};
