import { ReactNode } from 'react';

export interface MessageStyles {
  advanceViewIcon: ReactNode;
  systemMessageIcon?: ReactNode;
  processingTitle?: string;
  openAdvanceViewTitle?: string;
  messagesWrapperClass?: string;
}

export interface InputMessageStyles {
  inputContainerClass?: string;
  sendMessageIcon?: ReactNode;
}
