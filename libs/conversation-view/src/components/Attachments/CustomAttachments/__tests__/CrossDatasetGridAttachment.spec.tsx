import React from 'react';
import { act, render } from '@testing-library/react';
import type { GridReadyEvent } from 'ag-grid-community';
import { CrossDatasetGridAttachment } from '../CrossDatasetGridAttachment';
import { CrossDatasetGridAttachmentType } from '../../../../models/attachments';
import {
  GRID_HEADER_HEIGHT,
  GRID_ROW_HEIGHT,
  METADATA_CELL_RENDER,
} from '../../../../constants/grid';

jest.mock('ag-grid-community', () => ({
  ModuleRegistry: { registerModules: jest.fn() },
  ClientSideRowModelModule: {},
  TooltipModule: {},
  ValueCacheModule: {},
  ColumnApiModule: {},
  CellStyleModule: {},
  EventApiModule: {},
  RenderApiModule: {},
}));

let capturedGridProps: {
  onGridReady?: (event: GridReadyEvent) => void;
  onFirstDataRendered?: () => void;
  rowHeight?: number;
  headerHeight?: number;
  columnDefs?: Array<{
    colId?: string;
    cellRenderer?: string;
    width?: number;
    maxWidth?: number;
  }>;
} = {};

jest.mock('ag-grid-react', () => ({
  AgGridReact: (props: {
    onGridReady?: (event: GridReadyEvent) => void;
    onFirstDataRendered?: () => void;
    rowHeight?: number;
    headerHeight?: number;
    columnDefs?: Array<{
      colId?: string;
      cellRenderer?: string;
      width?: number;
      maxWidth?: number;
    }>;
  }) => {
    capturedGridProps = props;
    return <div data-testid="ag-grid-stub" />;
  },
}));

jest.mock('@epam/statgpt-ui-components', () => ({
  Loader: () => <div data-testid="loader" />,
  MOBILE_BREAKPOINT: 768,
  SERIES_LIMIT: 1000,
  useIsMobile: () => false,
}));

const GRID_CONTENT = {
  data: [{ id: '1' }],
  columns: [
    {
      colId: 'metadata',
      cellRenderer: METADATA_CELL_RENDER,
      width: 32,
      maxWidth: 32,
    },
    { colId: 'id', field: 'id' },
  ],
};

function buildAttachment(
  overrides: Partial<CrossDatasetGridAttachmentType> = {},
): CrossDatasetGridAttachmentType {
  return {
    type: 'cross_dataset_grid',
    title: 'Cross dataset grid',
    gridContent: GRID_CONTENT,
    ...overrides,
  } as CrossDatasetGridAttachmentType;
}

describe('CrossDatasetGridAttachment', () => {
  beforeEach(() => {
    capturedGridProps = {};
  });

  it('reports not-rendered before AG Grid fires onFirstDataRendered', () => {
    const onGridRenderedChange = jest.fn();
    render(
      <CrossDatasetGridAttachment
        attachment={buildAttachment()}
        onGridRenderedChange={onGridRenderedChange}
      />,
    );

    expect(onGridRenderedChange).toHaveBeenCalledWith(false);
    expect(onGridRenderedChange).not.toHaveBeenCalledWith(true);
  });

  it('reports rendered once AG Grid fires onFirstDataRendered', () => {
    const onGridRenderedChange = jest.fn();
    render(
      <CrossDatasetGridAttachment
        attachment={buildAttachment()}
        onGridRenderedChange={onGridRenderedChange}
      />,
    );

    act(() => {
      capturedGridProps.onFirstDataRendered?.();
    });

    expect(onGridRenderedChange).toHaveBeenLastCalledWith(true);
  });

  it('does not mount AG Grid while the attachment has no gridContent yet', () => {
    const onGridRenderedChange = jest.fn();
    const { queryByTestId } = render(
      <CrossDatasetGridAttachment
        attachment={buildAttachment({ gridContent: undefined })}
        onGridRenderedChange={onGridRenderedChange}
      />,
    );

    expect(queryByTestId('ag-grid-stub')).toBeNull();
    expect(queryByTestId('loader')).not.toBeNull();
    expect(onGridRenderedChange).toHaveBeenCalledWith(false);
  });

  it('resets to not-rendered when the attachment starts a new load', () => {
    const onGridRenderedChange = jest.fn();
    const { rerender } = render(
      <CrossDatasetGridAttachment
        attachment={buildAttachment()}
        onGridRenderedChange={onGridRenderedChange}
      />,
    );

    act(() => {
      capturedGridProps.onFirstDataRendered?.();
    });
    expect(onGridRenderedChange).toHaveBeenLastCalledWith(true);

    rerender(
      <CrossDatasetGridAttachment
        attachment={buildAttachment({ gridContent: undefined })}
        onGridRenderedChange={onGridRenderedChange}
      />,
    );

    expect(onGridRenderedChange).toHaveBeenLastCalledWith(false);
  });

  it('defaults rowHeight/headerHeight to the shared grid constants', () => {
    render(<CrossDatasetGridAttachment attachment={buildAttachment()} />);

    expect(capturedGridProps.rowHeight).toBe(GRID_ROW_HEIGHT);
    expect(capturedGridProps.headerHeight).toBe(GRID_HEADER_HEIGHT);
  });

  it('passes through custom rowHeight/headerHeight when provided', () => {
    render(
      <CrossDatasetGridAttachment
        attachment={buildAttachment()}
        rowHeight={44}
        headerHeight={44}
      />,
    );

    expect(capturedGridProps.rowHeight).toBe(44);
    expect(capturedGridProps.headerHeight).toBe(44);
  });

  it('leaves the metadata column at its default 32px width when metadataColumnWidth is not provided', () => {
    render(<CrossDatasetGridAttachment attachment={buildAttachment()} />);

    const metadataCol = capturedGridProps.columnDefs?.find(
      (col) => col.cellRenderer === METADATA_CELL_RENDER,
    );
    expect(metadataCol?.width).toBe(32);
    expect(metadataCol?.maxWidth).toBe(32);
  });

  it('overrides the metadata column width/maxWidth when metadataColumnWidth is provided', () => {
    render(
      <CrossDatasetGridAttachment
        attachment={buildAttachment()}
        metadataColumnWidth={44}
      />,
    );

    const metadataCol = capturedGridProps.columnDefs?.find(
      (col) => col.cellRenderer === METADATA_CELL_RENDER,
    );
    expect(metadataCol?.width).toBe(44);
    expect(metadataCol?.maxWidth).toBe(44);
  });
});
