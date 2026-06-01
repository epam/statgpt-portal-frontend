import React from 'react';
import { InlineAlertConfig } from '@epam/statgpt-ui-components';
import ErrorIcon from '../assets/error.svg';
import WarningIcon from '../assets/warning.svg';
import InfoIcon from '../assets/info.svg';

export const brand2AlertConfig: InlineAlertConfig = {
  icons: {
    error: <ErrorIcon className="text-semantic-error size-6" />,
    warning: <WarningIcon className="text-semantic-warning size-6" />,
    info: <InfoIcon className="text-neutrals-800 size-6" />,
  },
  classes: {
    container: 'flex gap-2 min-w-0 border rounded py-2 px-6 items-center',
  },
};
