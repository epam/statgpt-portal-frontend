'use client';

import { FC, useCallback } from 'react';
import AttachmentRenderer from '../Attachments/AttachmentRenderer';
import type { ComponentProps } from 'react';
import { useTableSettingsContext } from './TableSettings/TableSettingsContext';
import { useAdvancedViewSidePanel } from './SidePanel/AdvancedViewSidePanelContext';
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
  const { openPanel, closePanel, isPanelOpen } = useAdvancedViewSidePanel();

  const openTableSettingsPanel = useCallback(() => {
    openPanel({
      id: TABLE_SETTINGS_SIDE_PANEL_ID,
      title: attachmentsStyles?.columnsTitle || 'Columns',
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
    openPanel,
  ]);

  return (
    <AttachmentRenderer
      {...props}
      attachmentsStyles={attachmentsStyles}
      isTableSettingsOpen={isPanelOpen(TABLE_SETTINGS_SIDE_PANEL_ID)}
      onTableSettingsOpen={openTableSettingsPanel}
      onTableSettingsClose={closePanel}
      onGridApiReady={onGridApiReady}
    />
  );
};
