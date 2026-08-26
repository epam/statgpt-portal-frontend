import type { ComponentProps } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { CrossDatasetGridAttachment } from '../CrossDatasetGridAttachment';
import { CrossDatasetGridAttachmentType } from '../../../../models/attachments';
import {
  METADATA_CELL_RENDER,
  MERGED_DIMENSION_CELL_RENDER,
  CELL_PADDING_0,
} from '../../../../constants/grid';
import {
  COUNTRY_COL_ID,
  INDICATOR_COL_ID,
} from '../../../../constants/cross-dataset-grid';
import { ConversationViewStylesProvider } from '../../../../context/ConversationViewStylesContext';
import { OnboardingProvider } from '../../../../context/OnboardingContext';
import { ConversationViewFeatureTogglesProvider } from '../../../../context/ConversationViewFeatureTogglesContext';
import {
  ConversationViewSidePanelProvider,
  ConversationViewSidePanelOutlet,
} from '../../../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { AdvancedViewProvider } from '../../../../context/AdvancedViewContext';

const withProviders: Decorator = (Story) => (
  <ConversationViewStylesProvider>
    <OnboardingProvider>
      <AdvancedViewProvider>
        <ConversationViewFeatureTogglesProvider isMetadataInSidePanel>
          <ConversationViewSidePanelProvider>
            <Story />
          </ConversationViewSidePanelProvider>
        </ConversationViewFeatureTogglesProvider>
      </AdvancedViewProvider>
    </OnboardingProvider>
  </ConversationViewStylesProvider>
);

const emptyStructuresMap = new Map();
const emptyDatasetDimensionsSchemesMap = new Map();

const sampleAttachment: CrossDatasetGridAttachmentType = {
  type: 'application/json',
  title: 'Cross-dataset comparison',
  gridContent: {
    columns: [
      {
        headerName: '',
        pinned: true,
        width: 32,
        maxWidth: 32,
        cellClass: CELL_PADDING_0,
        cellRenderer: METADATA_CELL_RENDER,
        cellRendererParams: {
          structuresMap: emptyStructuresMap,
          attributesDataMap: new Map(),
          locale: 'en',
        },
      },
      {
        headerName: 'Country dimensions',
        field: COUNTRY_COL_ID,
        colId: COUNTRY_COL_ID,
        flex: 1,
        minWidth: 200,
        cellClass: CELL_PADDING_0,
        cellRenderer: MERGED_DIMENSION_CELL_RENDER,
        cellRendererParams: {
          structuresMap: emptyStructuresMap,
          datasetDimensionsSchemesMap: emptyDatasetDimensionsSchemesMap,
          locale: 'en',
          colId: COUNTRY_COL_ID,
        },
      },
      {
        headerName: 'Indicator dimensions',
        field: INDICATOR_COL_ID,
        colId: INDICATOR_COL_ID,
        flex: 1,
        minWidth: 200,
        cellClass: CELL_PADDING_0,
        cellRenderer: MERGED_DIMENSION_CELL_RENDER,
        cellRendererParams: {
          structuresMap: emptyStructuresMap,
          datasetDimensionsSchemesMap: emptyDatasetDimensionsSchemesMap,
          locale: 'en',
          colId: INDICATOR_COL_ID,
        },
      },
    ],
    data: [
      {
        dataset: { urn: 'urn:sdmx:example:1' },
        [COUNTRY_COL_ID]: 'Ukraine',
        [INDICATOR_COL_ID]: 'GDP, current prices',
      },
      {
        dataset: { urn: 'urn:sdmx:example:2' },
        [COUNTRY_COL_ID]: 'Poland',
        [INDICATOR_COL_ID]: 'GDP, current prices',
      },
      {
        dataset: { urn: 'urn:sdmx:example:3' },
        [COUNTRY_COL_ID]: 'Germany',
        [INDICATOR_COL_ID]: 'Unemployment rate',
      },
    ],
  },
};

/**
 * Shared base for every story in this file: lays the grid out beside a real
 * `ConversationViewSidePanelOutlet` so the metadata-indicator triangle is
 * clickable and opens the actual side panel in every variant, not just one.
 * @param args - Props forwarded to `CrossDatasetGridAttachment`.
 */
function renderWithClickableTriangle(
  args: ComponentProps<typeof CrossDatasetGridAttachment>,
) {
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <CrossDatasetGridAttachment {...args} />
      </div>
      <ConversationViewSidePanelOutlet scope="conversation" />
    </div>
  );
}

const meta: Meta<typeof CrossDatasetGridAttachment> = {
  title: 'Conversation View/Grid/CrossDatasetGrid',
  component: CrossDatasetGridAttachment,
  decorators: [withProviders],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CrossDatasetGridAttachment>;

export const WithData: Story = {
  render: renderWithClickableTriangle,
  args: {
    attachment: sampleAttachment,
  },
};

export const TallRows: Story = {
  name: 'Tall Rows (44px row height + metadata column width)',
  render: renderWithClickableTriangle,
  args: {
    attachment: sampleAttachment,
    rowHeight: 44,
    headerHeight: 44,
    metadataColumnWidth: 44,
  },
};
