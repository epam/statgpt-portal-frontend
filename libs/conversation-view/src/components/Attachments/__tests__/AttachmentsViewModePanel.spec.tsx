import React from 'react';
import { render, screen } from '@testing-library/react';
import AttachmentsViewModePanel from '../AttachmentsViewModePanel';
import { Attachment } from '@epam/ai-dial-shared';

jest.mock('../../../context/ConversationViewFeatureTogglesContext', () => ({
  useConversationViewFeatureToggles: () => ({
    isTableSettingsFeatureEnabled: true,
  }),
}));

jest.mock('../../../context/AdvancedViewContext', () => ({
  useAdvancedView: () => ({ isOpenedAdvancedView: false }),
}));

jest.mock('../../../context/ConversationViewStylesContext', () => ({
  useConversationViewStyles: () => ({ titles: {} }),
}));

jest.mock('../../../context/OnboardingContext', () => ({
  useOnboarding: () => ({
    onboardingFileSchema: undefined,
    isShowOnboarding: false,
  }),
}));

const GRID_ATTACHMENT = {
  type: 'custom_data_grid',
  title: 'Data grid',
} as Attachment;

const commonProps = {
  attachments: [GRID_ATTACHMENT],
  selectedAttachmentIndex: 0,
  selectedAttachment: GRID_ATTACHMENT,
  onSelectedAttachmentChange: jest.fn(),
  onDownloadClick: jest.fn(),
  onOpenAdvancedView: jest.fn(),
  onTableSettingsOpen: jest.fn(),
  attachmentsStyles: {
    downloadTitle: 'Download',
    advancedViewTitle: 'Advanced view',
    tableSettings: 'Table settings',
  },
};

// `showAdvancedView` gates the Advanced view button; `!showAdvancedView` gates
// the Table settings button — they are mutually exclusive, so each mode is
// exercised with its own render.
function renderWithAdvancedView(disabled?: boolean) {
  render(
    <AttachmentsViewModePanel
      {...commonProps}
      showAdvancedView
      disabled={disabled}
    />,
  );
}

function renderWithTableSettings(disabled?: boolean) {
  render(
    <AttachmentsViewModePanel
      {...commonProps}
      showAdvancedView={false}
      disabled={disabled}
    />,
  );
}

describe('AttachmentsViewModePanel', () => {
  it('enables Download and Advanced view buttons when not disabled', () => {
    renderWithAdvancedView(false);

    expect(screen.getByText('Download').closest('button')).toBeEnabled();
    expect(screen.getByText('Advanced view').closest('button')).toBeEnabled();
  });

  it('disables Download and Advanced view buttons when disabled', () => {
    renderWithAdvancedView(true);

    expect(screen.getByText('Download').closest('button')).toBeDisabled();
    expect(screen.getByText('Advanced view').closest('button')).toBeDisabled();
  });

  it('enables the Table settings button when not disabled', () => {
    renderWithTableSettings(false);

    expect(screen.getByText('Table settings').closest('button')).toBeEnabled();
  });

  it('disables the Table settings button when disabled', () => {
    renderWithTableSettings(true);

    expect(screen.getByText('Table settings').closest('button')).toBeDisabled();
  });
});
