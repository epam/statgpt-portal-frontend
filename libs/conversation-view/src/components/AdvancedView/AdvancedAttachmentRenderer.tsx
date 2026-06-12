'use client';

import { FC, useCallback } from 'react';
import { AttachmentRenderer } from '../Attachments/AttachmentRenderer';
import type { ComponentProps } from 'react';
import { useTableSettingsContext } from './TableSettings/TableSettingsContext';
import { useConversationViewSidePanelOptional } from '../ConversationView/SidePanel/ConversationViewSidePanelContext';
import {
  TABLE_SETTINGS_SIDE_PANEL_ID,
  TableSettingsPanel,
} from './TableSettings/TableSettingsPanel';
import { useConversationViewStyles } from '../../context/ConversationViewStylesContext';

type AttachmentRendererProps = ComponentProps<typeof AttachmentRenderer>;

export const AdvancedAttachmentRenderer: FC<AttachmentRendererProps> = (
  props,
) => {
  const { attachmentsStyles } = useConversationViewStyles();
  const { onGridApiReady } = useTableSettingsContext();
  const sidePanel = useConversationViewSidePanelOptional();

  const openTableSettingsPanel = useCallback(() => {
    if (!sidePanel) {
      return;
    }

    sidePanel.openPanel({
      id: TABLE_SETTINGS_SIDE_PANEL_ID,
      scope: 'advanced',
      title: attachmentsStyles?.tableSettings || 'Table settings',
      headerClassName: 'border-b border-neutrals-500',
      content: <TableSettingsPanel />,
    });
  }, [sidePanel, attachmentsStyles?.tableSettings]);

  return (
    <AttachmentRenderer
      {...props}
      isTableSettingsOpen={
        sidePanel?.isPanelOpen(TABLE_SETTINGS_SIDE_PANEL_ID) ?? false
      }
      onTableSettingsOpen={sidePanel ? openTableSettingsPanel : undefined}
      onTableSettingsClose={sidePanel?.closePanel}
      onGridApiReady={onGridApiReady}
    />
  );
};
