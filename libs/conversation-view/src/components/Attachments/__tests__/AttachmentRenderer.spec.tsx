import React from 'react';
import { render, screen } from '@testing-library/react';
import AttachmentRenderer from '../AttachmentRenderer';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';

jest.mock('ag-grid-community', () => ({
  AllCommunityModule: {},
  ModuleRegistry: { registerModules: jest.fn() },
}));

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  generateShortUrn: (id?: string, version?: string, agencyID?: string) => {
    const versionStr = version === '' ? '' : `(${version})`;
    return `${agencyID}:${id}${versionStr}`;
  },
  DownloadType: { DATA_IN_TABLE: 'DATA_IN_TABLE' },
}));

jest.mock('@epam/statgpt-ui-components', () => ({
  Loader: () => null,
  PopUpState: { Closed: 'Closed', Opened: 'Opened' },
  RequestLimitMessage: () => null,
}));

jest.mock(
  '@statgpt/download-panel/src/components/DownloadSettings/DownloadSettings',
  () => ({ __esModule: true, default: () => null }),
);

jest.mock('../../../context/ConversationViewStylesContext', () => ({
  useConversationViewStyles: () => ({
    titles: {},
    messageStyles: {},
    attachmentsStyles: {},
    limitMessages: undefined,
    attachmentsConfig: undefined,
  }),
}));

jest.mock('../../../context/ConversationViewFeatureTogglesContext', () => ({
  useConversationViewFeatureToggles: jest.fn(),
}));

jest.mock('../../../context/AdvancedViewContext', () => ({
  useAdvancedView: () => ({
    isOpenedAdvancedView: false,
    setIsOpenedAdvancedView: jest.fn(),
  }),
}));

jest.mock('../AttachmentDetails/AttachmentDetails', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../AttachmentCollapsed', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../AttachmentsViewModePanel', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../AttachmentsContentRenderer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../DownloadAlert/DownloadAlert', () => ({
  DownloadAlert: () => null,
}));
jest.mock('../useAttachmentDownloadFlow', () => ({
  useAttachmentDownloadFlow: () => ({
    startDownload: jest.fn(),
    isDownloadRunning: false,
    downloadAlertProps: {},
  }),
}));
jest.mock('../../../utils/attachments/attachment-parser', () => ({
  isAnyGridAttachment: jest.fn().mockReturnValue(false),
  isCrossDatasetGrid: jest.fn().mockReturnValue(false),
  isCustomGridAttachment: jest.fn().mockReturnValue(false),
}));
jest.mock('../../../utils/attachments-details', () => ({
  getExternalLink: jest.fn().mockReturnValue(undefined),
}));

jest.mock('../Tabs/DatasetTabs/DatasetTabs', () => ({
  __esModule: true,
  default: ({ datasets }: { datasets?: Array<{ id: string }> }) => (
    <>
      {datasets?.map((d) => (
        <span key={d.id} data-testid={`dataset-tab-${d.id}`} />
      ))}
    </>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockFeatureToggles = useConversationViewFeatureToggles as jest.Mock;

const DATASET_A = { id: 'DS_A', version: '1.0', agencyID: 'TEST' };
const DATASET_B = { id: 'DS_B', version: '1.0', agencyID: 'TEST' };

const QUERY_A: DataQuery = { urn: 'TEST:DS_A(1.0)' } as DataQuery;
const QUERY_B: DataQuery = {
  urn: 'TEST:DS_B(1.0)',
  disabled: true,
} as DataQuery;

const mockActions = {
  getFile: jest.fn(),
  putOnboardingFile: jest.fn(),
  getDataSet: jest.fn(),
  getDataSetData: jest.fn(),
  getConstraints: jest.fn(),
  downloadDataSet: jest.fn(),
  updateCurrentDataQuery: jest.fn(),
  updateDataQueries: jest.fn(),
  updateDatasets: jest.fn(),
};

const STUB_ATTACHMENT = { title: 'stub' } as any;

function renderComponent(
  dataQueries: DataQuery[],
  isCrossDatasetModeOn = true,
) {
  mockFeatureToggles.mockReturnValue({ isCrossDatasetModeOn });
  render(
    <AttachmentRenderer
      attachments={[STUB_ATTACHMENT]}
      actions={mockActions}
      isDataSetAttachments={true}
      datasets={[DATASET_A as any, DATASET_B as any]}
      dataQueries={dataQueries}
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AttachmentRenderer — DatasetTabs dataset filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes only enabled datasets to DatasetTabs in cross-dataset mode', () => {
    renderComponent([QUERY_A, QUERY_B], true);

    expect(screen.getByTestId('dataset-tab-DS_A')).toBeInTheDocument();
    expect(screen.queryByTestId('dataset-tab-DS_B')).not.toBeInTheDocument();
  });

  it('passes all datasets to DatasetTabs when not in cross-dataset mode', () => {
    renderComponent([QUERY_A, QUERY_B], false);

    expect(screen.getByTestId('dataset-tab-DS_A')).toBeInTheDocument();
    expect(screen.getByTestId('dataset-tab-DS_B')).toBeInTheDocument();
  });

  it('passes all datasets when no dataQueries are disabled', () => {
    const allEnabled: DataQuery[] = [QUERY_A, { ...QUERY_B, disabled: false }];
    renderComponent(allEnabled, true);

    expect(screen.getByTestId('dataset-tab-DS_A')).toBeInTheDocument();
    expect(screen.getByTestId('dataset-tab-DS_B')).toBeInTheDocument();
  });

  it('hides DatasetTabs entirely when all datasets are disabled', () => {
    const allDisabled: DataQuery[] = [
      { ...QUERY_A, disabled: true },
      { ...QUERY_B, disabled: true },
    ];
    renderComponent(allDisabled, true);

    expect(screen.queryByTestId('dataset-tab-DS_A')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dataset-tab-DS_B')).not.toBeInTheDocument();
  });
});
