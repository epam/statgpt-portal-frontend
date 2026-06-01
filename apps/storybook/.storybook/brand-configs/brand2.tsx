import React from 'react';
import { InlineAlertConfig } from '@epam/statgpt-ui-components';
import ErrorIcon from './assets/error.svg';
import WarningIcon from './assets/warning.svg';
import InfoIcon from './assets/info.svg';

export const brand2AlertConfig: InlineAlertConfig = {
  icons: {
    error: <ErrorIcon className="size-6 text-semantic-error" />,
    warning: <WarningIcon className="size-6 text-semantic-warning" />,
    info: <InfoIcon className="size-6 text-neutrals-800" />,
  },
  classes: {
    container:
      'flex items-start gap-2 min-w-0 border rounded py-2 px-6 items-center',
  },
};
