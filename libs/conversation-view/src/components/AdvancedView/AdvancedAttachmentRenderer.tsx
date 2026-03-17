'use client';

import { FC } from 'react';
import AttachmentRenderer from '../Attachments/AttachmentRenderer';
import type { ComponentProps } from 'react';
import { useTableSettingsContext } from './TableSettings/TableSettingsContext';

type AttachmentRendererProps = ComponentProps<typeof AttachmentRenderer>;

export const AdvancedAttachmentRenderer: FC<AttachmentRendererProps> = (props) => {
  const {
    tableSettings: { isOpen, open, close },
    agGrid: { onGridApiReady },
  } = useTableSettingsContext();

  return (
    <AttachmentRenderer
      {...props}
      isTableSettingsOpen={isOpen}
      onTableSettingsOpen={open}
      onTableSettingsClose={close}
      onGridApiReady={onGridApiReady}
    />
  );
};
