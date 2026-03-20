'use client';

import { FC, useCallback } from 'react';
import AttachmentRenderer from '../Attachments/AttachmentRenderer';
import type { ComponentProps } from 'react';
import { useTableSettingsContext } from './TableSettings/TableSettingsContext';
import { useConversationViewSidePanelOptional } from '../ConversationView/SidePanel/ConversationViewSidePanelContext';
import {
  TABLE_SETTINGS_SIDE_PANEL_ID,
  TableSettingsPanelHeaderExtension,
  TableSettingsPanel,
} from './TableSettings/TableSettingsPanel';

type AttachmentRendererProps = ComponentProps<typeof AttachmentRenderer>;

export const AdvancedAttachmentRenderer: FC<AttachmentRendererProps> = ({
  attachmentsStyles,
  ...props
}) => {
  const { onGridApiReady } = useTableSettingsContext();
  const sidePanel = useConversationViewSidePanelOptional();

  const openTableSettingsPanel = useCallback(() => {
    if (!sidePanel) {
      return;
    }

    sidePanel.openPanel({
      id: TABLE_SETTINGS_SIDE_PANEL_ID,
      scope: 'advanced',
      title: attachmentsStyles?.columnsTitle || 'Columns',
      headerClassName: 'border-b border-neutrals-500',
      headerExtension: (
        <TableSettingsPanelHeaderExtension
          resetTitle={attachmentsStyles?.columnsResetTitle}
        />
      ),
      content: <TableSettingsPanel />,
    });
  }, [
    attachmentsStyles?.columnsResetTitle,
    attachmentsStyles?.columnsTitle,
    sidePanel,
  ]);

  return (
    <AttachmentRenderer
      {...props}
      attachmentsStyles={attachmentsStyles}
      isTableSettingsOpen={
        sidePanel?.isPanelOpen(TABLE_SETTINGS_SIDE_PANEL_ID) ?? false
      }
      onTableSettingsOpen={sidePanel ? openTableSettingsPanel : undefined}
      onTableSettingsClose={sidePanel?.closePanel}
      onGridApiReady={onGridApiReady}
    />
  );
};
