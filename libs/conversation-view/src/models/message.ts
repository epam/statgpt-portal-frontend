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
  retryIcon?: ReactNode;
}

export interface MessageActionIcons {
  copy?: ReactNode;
  copied?: ReactNode;
  regenerate?: ReactNode;
  thumbUp?: ReactNode;
  thumbDown?: ReactNode;
  edit?: ReactNode;
  thumbPressed?: ReactNode;
}

export interface MessageActionTitles {
  copy?: string;
  regenerate?: string;
  like?: string;
  dislike?: string;
}

export interface EditMessageTitles {
  cancel?: string;
  send?: string;
}
